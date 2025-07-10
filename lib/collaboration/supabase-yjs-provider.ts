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

export class SupabaseProvider {
  public doc: Y.Doc;
  private channel: RealtimeChannel | null = null;
  private supabase = createClient();
  private awareness: Awareness;
  private isConnected = false;
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

  constructor(doc: Y.Doc, options: SupabaseProviderOptions) {
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
    this.connect();
  }

  private async connect() {
    try {
      // Create channel for this note
      this.channel = this.supabase.channel(`note:${this.noteId}`, {
        config: {
          broadcast: {
            self: false, // Don't receive own messages
            ack: true, // Acknowledge message receipt
          },
        },
      });

      // Subscribe to document updates
      this.channel.on('broadcast', { event: 'doc-update' }, (payload) => {
        const update = new Uint8Array(payload.payload.update);
        Y.applyUpdate(this.doc, update, 'supabase');
      });

      // Subscribe to awareness updates
      this.channel.on('broadcast', { event: 'awareness-update' }, (payload) => {
        const update = new Uint8Array(payload.payload.update);
        applyAwarenessUpdate(this.awareness, update, 'supabase');
      });

      // Subscribe to presence for user tracking
      this.channel.on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState();
        if (state) {
          // Update awareness with all present users
          Object.entries(state).forEach(([key, presences]) => {
            if (Array.isArray(presences) && presences.length > 0) {
              const presence = presences[0] as any;
              if (presence.user && presence.clientId !== this.awareness.clientID) {
                // Update remote awareness states by setting them directly
                this.awareness.setLocalStateField(`remote-${presence.clientId}`, {
                  user: presence.user,
                  clientId: presence.clientId
                });
                
                // Reset presence timeout for this user
                this.resetPresenceTimeout(presence.clientId);
              }
            }
          });
        }
      });

      this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle new user joining
      });

      this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
        if (leftPresences && leftPresences.length > 0) {
          const leftPresence = leftPresences[0] as any;
          if (leftPresence.clientId) {
            this.awareness.setLocalStateField(`user-${leftPresence.clientId}`, null);
          }
        }
      });

      // Subscribe to the channel
      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.notifyConnectionListeners(true);

          // Track presence
          await this.channel?.track({
            user: this.user,
            clientId: this.awareness.clientID,
          });

          // Send initial document state
          const stateVector = Y.encodeStateAsUpdate(this.doc);
          await this.broadcastDocUpdate(stateVector);

          // Send initial awareness state
          const awarenessStates = this.awareness.getStates();
          if (awarenessStates.size > 0) {
            // Use the proper awareness encoding
            const update = encodeAwarenessUpdate(this.awareness, Array.from(awarenessStates.keys()));
            await this.broadcastAwarenessUpdate(update);
          }

          // Start listening to local changes
          this.doc.on('update', this.updateHandler);
          this.awareness.on('update', this.awarenessUpdateHandler);
        } else if (status === 'CLOSED') {
          this.isConnected = false;
          this.notifyConnectionListeners(false);
        }
      });
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    }
  }

  private async handleDocUpdate(update: Uint8Array, origin: any) {
    if (origin !== 'supabase' && this.isConnected) {
      await this.broadcastDocUpdate(update);
    }
  }

  private async handleAwarenessUpdate(
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: any
  ) {
    if (origin !== 'supabase' && origin !== 'supabase-presence' && this.isConnected) {
      const changedClients = added.concat(updated).concat(removed);
      // Use the proper awareness encoding for the changed clients
      const update = encodeAwarenessUpdate(this.awareness, changedClients);
      await this.broadcastAwarenessUpdate(update);
    }
  }

  private async broadcastDocUpdate(update: Uint8Array): Promise<void> {
    if (!this.channel || !this.isConnected) return;

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'doc-update',
        payload: {
          update: Array.from(update),
        },
      });
    } catch (error) {
      console.error('Failed to broadcast doc update:', error);
    }
  }

  private async broadcastAwarenessUpdate(update: Uint8Array): Promise<void> {
    if (!this.channel || !this.isConnected) return;

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'awareness-update',
        payload: {
          update: Array.from(update),
        },
      });
    } catch (error) {
      console.error('Failed to broadcast awareness update:', error);
    }
  }

  public onConnectionChange(callback: (isConnected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    // Call immediately with current status
    callback(this.isConnected);
    
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
      this.awareness.setLocalStateField(`remote-${clientId}`, null);
      
      this.presenceTimeouts.delete(clientId);
    }, this.PRESENCE_TIMEOUT);

    this.presenceTimeouts.set(clientId, timeout);
  }

  public async disconnect() {
    this.isConnected = false;
    this.notifyConnectionListeners(false);

    // Remove listeners
    this.doc.off('update', this.updateHandler);
    this.awareness.off('update', this.awarenessUpdateHandler);

    // Clear all presence timeouts
    this.presenceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.presenceTimeouts.clear();

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
    return this.isConnected;
  }
}