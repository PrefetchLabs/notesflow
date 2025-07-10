import * as Y from 'yjs';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { createClient } from '@/lib/supabase/client';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

export interface SupabaseProviderOptions {
  noteId: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
}

export class SupabaseProvider extends EventTarget {
  public doc: Y.Doc;
  public awareness: Awareness;
  private channel: RealtimeChannel | null = null;
  private supabase = createClient();
  private _connected = false;
  private noteId: string;
  private user: SupabaseProviderOptions['user'];
  private updateHandler: (update: Uint8Array, origin: any) => void;
  private awarenessUpdateHandler: (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: any
  ) => void;
  private connectionListeners: Set<(isConnected: boolean) => void> = new Set();
  private presenceTimeouts: Map<number, NodeJS.Timeout> = new Map();
  private readonly PRESENCE_TIMEOUT = 30000; // 30 seconds
  private presenceInterval: NodeJS.Timeout | null = null;
  
  // WebSocket compatibility properties
  get connected() {
    return this._connected;
  }
  
  // BlockNote expects these methods
  connect() {
    // Already connecting in constructor
  }
  
  destroy() {
    this.disconnect();
  }

  constructor(doc: Y.Doc, options: SupabaseProviderOptions) {
    super();
    this.doc = doc;
    this.noteId = options.noteId;
    this.user = options.user;
    this.awareness = new Awareness(doc);
    
    // Set local user info in awareness
    this.awareness.setLocalStateField('user', {
      id: this.user.id,
      name: this.user.name,
      color: this.user.color,
    });

    // Bind handlers
    this.updateHandler = this.handleDocUpdate.bind(this);
    this.awarenessUpdateHandler = this.handleAwarenessUpdate.bind(this);

    // Start connection
    this.setupConnection();
  }

  private async setupConnection() {
    console.log(`[SupabaseProvider] Connecting to note:${this.noteId}...`);
    try {
      // Get current session for auth
      const { data: { session } } = await this.supabase.auth.getSession();
      console.log('[SupabaseProvider] Auth session exists:', !!session);
      
      // Create channel for this note with auth
      this.channel = this.supabase.channel(`note:${this.noteId}`, {
        config: {
          broadcast: {
            self: false, // Don't receive own messages
            ack: true, // Acknowledge message receipt
          },
          presence: {
            key: this.user.id, // Use user ID as presence key
          },
        },
      });
      
      // Subscribe to sync requests
      this.channel.on('broadcast', { event: 'sync-request' }, async (payload) => {
        console.log('[SupabaseProvider] Received sync request from:', payload.payload.clientId);
        // Send current state to the requesting client
        const stateVector = Y.encodeStateAsUpdate(this.doc);
        if (stateVector.length > 10) { // Only send if we have content
          await this.broadcastDocUpdate(stateVector);
        }
      });

      // Subscribe to document updates
      this.channel.on('broadcast', { event: 'doc-update' }, (payload) => {
        try {
          console.log('[SupabaseProvider] Received doc update');
          
          // Decode based on encoding type
          let update: Uint8Array;
          if (payload.payload.encoding === 'base64') {
            const binaryString = atob(payload.payload.update);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            update = bytes;
          } else if (payload.payload.encoding === 'array') {
            // Direct array format
            update = new Uint8Array(payload.payload.update);
          } else {
            // Fallback for old format
            update = new Uint8Array(payload.payload.update);
          }
          
          Y.applyUpdate(this.doc, update, 'supabase');
        } catch (error) {
          console.error('[SupabaseProvider] Error applying doc update:', error);
        }
      });

      // Subscribe to awareness updates
      this.channel.on('broadcast', { event: 'awareness-update' }, (payload) => {
        try {
          // Decode based on encoding type
          let update: Uint8Array;
          if (payload.payload.encoding === 'base64') {
            const binaryString = atob(payload.payload.update);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            update = bytes;
          } else if (payload.payload.encoding === 'array') {
            // Direct array format
            update = new Uint8Array(payload.payload.update);
          } else {
            // Fallback for old format
            update = new Uint8Array(payload.payload.update);
          }
          
          applyAwarenessUpdate(this.awareness, update, 'supabase');
        } catch (error) {
          console.error('[SupabaseProvider] Error applying awareness update:', error);
        }
      });

      // Subscribe to presence for user tracking
      this.channel.on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState();
        console.log('[SupabaseProvider] Presence sync event, state:', state);
        if (state) {
          // Get all current client IDs from presence
          const currentClientIds = new Set<number>();
          
          // Update awareness with all present users
          Object.entries(state).forEach(([key, presences]) => {
            if (Array.isArray(presences) && presences.length > 0) {
              presences.forEach((presence: any) => {
                if (presence.user && presence.clientId && presence.clientId !== this.awareness.clientID) {
                  currentClientIds.add(presence.clientId);
                  
                  // Create a new awareness state for this client
                  const encoder = encoding.createEncoder();
                  encoding.writeVarUint(encoder, presence.clientId);
                  encoding.writeVarUint(encoder, 1); // clock
                  encoding.writeVarString(encoder, JSON.stringify({
                    user: presence.user
                  }));
                  
                  applyAwarenessUpdate(this.awareness, encoding.toUint8Array(encoder), 'supabase-presence');
                  
                  // Reset presence timeout for this user
                  this.resetPresenceTimeout(presence.clientId);
                }
              });
            }
          });
          
          // Remove awareness states for users no longer present
          const allStates = this.awareness.getStates();
          allStates.forEach((state, clientId) => {
            if (clientId !== this.awareness.clientID && !currentClientIds.has(clientId)) {
              removeAwarenessStates(this.awareness, [clientId], 'presence-leave');
            }
          });
        }
      });

      this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle new user joining
        if (newPresences && newPresences.length > 0) {
          newPresences.forEach((presence: any) => {
            if (presence.user && presence.clientId && presence.clientId !== this.awareness.clientID) {
              // Create awareness update for the new user
              const encoder = encoding.createEncoder();
              encoding.writeVarUint(encoder, presence.clientId);
              encoding.writeVarUint(encoder, 1); // clock
              encoding.writeVarString(encoder, JSON.stringify({
                user: presence.user
              }));
              
              applyAwarenessUpdate(this.awareness, encoding.toUint8Array(encoder), 'supabase-presence');
              this.resetPresenceTimeout(presence.clientId);
            }
          });
        }
      });

      this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
        if (leftPresences && leftPresences.length > 0) {
          leftPresences.forEach((presence: any) => {
            if (presence.clientId) {
              removeAwarenessStates(this.awareness, [presence.clientId], 'presence-leave');
              
              // Clear presence timeout
              const timeout = this.presenceTimeouts.get(presence.clientId);
              if (timeout) {
                clearTimeout(timeout);
                this.presenceTimeouts.delete(presence.clientId);
              }
            }
          });
        }
      });

      // Subscribe to the channel
      const subscribeResult = await this.channel.subscribe(async (status, error) => {
        console.log(`[SupabaseProvider] Channel status: ${status}`, error ? `Error: ${error}` : '');
        
        if (error) {
          console.error(`[SupabaseProvider] Subscription error:`, error);
          this._connected = false;
          this.notifyConnectionListeners(false);
          this.dispatchEvent(new Event('status'));
          return;
        }
        
        if (status === 'SUBSCRIBED') {
          this._connected = true;
          this.notifyConnectionListeners(true);
          this.dispatchEvent(new Event('status'));
          console.log(`[SupabaseProvider] Connected successfully to note:${this.noteId}`);

          // Track presence - wait a bit to ensure channel is ready
          setTimeout(async () => {
            try {
              const trackResult = await this.channel?.track({
                user: this.user,
                clientId: this.awareness.clientID,
              });
              console.log('[SupabaseProvider] Presence tracked:', trackResult);
            } catch (error) {
              console.error('[SupabaseProvider] Failed to track presence:', error);
            }
          }, 100);

          // Wait a bit before sending initial state to ensure channel is ready
          setTimeout(async () => {
            // Check if document is empty (first user)
            const stateVector = Y.encodeStateAsUpdate(this.doc);
            const isEmpty = stateVector.length < 10; // Very small state = empty doc
            
            if (isEmpty) {
              console.log('[SupabaseProvider] Document is empty, waiting for sync from other users');
              // Don't broadcast empty state, wait for sync
            } else {
              console.log('[SupabaseProvider] Sending initial document state, size:', stateVector.length);
              await this.broadcastDocUpdate(stateVector);
            }

            // Send initial awareness state
            const awarenessStates = this.awareness.getStates();
            if (awarenessStates.size > 0) {
              // Use the proper awareness encoding
              const update = encodeAwarenessUpdate(this.awareness, Array.from(awarenessStates.keys()));
              console.log('[SupabaseProvider] Sending initial awareness state');
              await this.broadcastAwarenessUpdate(update);
            }
            
            // Request sync from other users
            await this.channel?.send({
              type: 'broadcast',
              event: 'sync-request',
              payload: {
                clientId: this.awareness.clientID,
              },
            });
          }, 500); // Give channel time to stabilize

          // Start listening to local changes
          this.doc.on('update', this.updateHandler);
          this.awareness.on('update', this.awarenessUpdateHandler);
          
          // Start periodic presence updates to keep connection alive
          this.presenceInterval = setInterval(async () => {
            if (this.channel && this._connected) {
              const trackData = {
                user: this.user,
                clientId: this.awareness.clientID,
                timestamp: Date.now(),
              };
              console.log('[SupabaseProvider] Periodic presence update:', trackData);
              await this.channel.track(trackData);
            }
          }, 10000); // Update every 10 seconds
        } else if (status === 'CLOSED') {
          this._connected = false;
          this.notifyConnectionListeners(false);
          this.dispatchEvent(new Event('status'));
        } else {
          console.log(`[SupabaseProvider] Channel status changed to: ${status}`);
        }
      });
      
      console.log('[SupabaseProvider] Subscribe result:', subscribeResult);
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      this._connected = false;
      this.notifyConnectionListeners(false);
      this.dispatchEvent(new Event('status'));
    }
  }

  private async handleDocUpdate(update: Uint8Array, origin: any) {
    if (origin !== 'supabase' && this._connected) {
      await this.broadcastDocUpdate(update);
    }
  }

  private async handleAwarenessUpdate(
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: any
  ) {
    if (origin !== 'supabase' && origin !== 'supabase-presence' && this._connected) {
      const changedClients = added.concat(updated).concat(removed);
      // Use the proper awareness encoding for the changed clients
      const update = encodeAwarenessUpdate(this.awareness, changedClients);
      await this.broadcastAwarenessUpdate(update);
    }
  }

  private async broadcastDocUpdate(update: Uint8Array): Promise<void> {
    if (!this.channel || !this._connected) return;

    try {
      // For small updates, use direct array
      if (update.length < 1000) {
        await this.channel.send({
          type: 'broadcast',
          event: 'doc-update',
          payload: {
            update: Array.from(update),
            encoding: 'array',
          },
        });
      } else {
        // For larger updates, use base64 with chunking
        let base64Update = '';
        const chunkSize = 32768; // 32KB chunks
        
        for (let i = 0; i < update.length; i += chunkSize) {
          const chunk = update.slice(i, i + chunkSize);
          base64Update += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
        }
        
        await this.channel.send({
          type: 'broadcast',
          event: 'doc-update',
          payload: {
            update: base64Update,
            encoding: 'base64',
          },
        });
      }
    } catch (error) {
      console.error('Failed to broadcast doc update:', error);
    }
  }

  private async broadcastAwarenessUpdate(update: Uint8Array): Promise<void> {
    if (!this.channel || !this._connected) return;

    try {
      // Awareness updates are usually small, use array
      await this.channel.send({
        type: 'broadcast',
        event: 'awareness-update',
        payload: {
          update: Array.from(update),
          encoding: 'array',
        },
      });
    } catch (error) {
      console.error('Failed to broadcast awareness update:', error);
    }
  }

  public onConnectionChange(callback: (isConnected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    // Call immediately with current status
    callback(this._connected);
    
    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyConnectionListeners(isConnected: boolean) {
    this.connectionListeners.forEach(listener => listener(isConnected));
  }

  private resetPresenceTimeout(clientId: number) {
    // Clear existing timeout
    const existingTimeout = this.presenceTimeouts.get(clientId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      // Remove user from awareness after timeout
      removeAwarenessStates(this.awareness, [clientId], 'timeout');
      this.presenceTimeouts.delete(clientId);
    }, this.PRESENCE_TIMEOUT);

    this.presenceTimeouts.set(clientId, timeout);
  }

  public async disconnect() {
    this._connected = false;
    this.notifyConnectionListeners(false);
    this.dispatchEvent(new Event('status'));

    // Remove listeners
    this.doc.off('update', this.updateHandler);
    this.awareness.off('update', this.awarenessUpdateHandler);

    // Clear all presence timeouts
    this.presenceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.presenceTimeouts.clear();
    
    // Clear presence interval
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }

    // Untrack presence
    if (this.channel) {
      await this.channel.untrack();
      await this.supabase.removeChannel(this.channel);
    }

    this.channel = null;
  }

  public getAwareness(): Awareness {
    return this.awareness;
  }

  public getConnectionState(): boolean {
    return this._connected;
  }
}