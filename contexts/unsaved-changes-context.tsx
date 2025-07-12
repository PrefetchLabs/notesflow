'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  confirmNavigation: (callback: () => void) => void;
  promptToSave: (onSave: () => Promise<void>, onDiscard: () => void, onCancel?: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'navigate' | 'save';
    onConfirm?: () => void;
    onSave?: () => Promise<void>;
    onDiscard?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const confirmNavigation = useCallback((callback: () => void) => {
    if (!hasUnsavedChanges) {
      callback();
      return;
    }

    setPendingAction({ type: 'navigate', onConfirm: callback });
    setShowDialog(true);
  }, [hasUnsavedChanges]);

  const promptToSave = useCallback((
    onSave: () => Promise<void>,
    onDiscard: () => void,
    onCancel?: () => void
  ) => {
    if (!hasUnsavedChanges) {
      onDiscard();
      return;
    }

    setPendingAction({ 
      type: 'save', 
      onSave, 
      onDiscard, 
      onCancel 
    });
    setShowDialog(true);
  }, [hasUnsavedChanges]);

  const handleConfirm = useCallback(async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'navigate' && pendingAction.onConfirm) {
      setHasUnsavedChanges(false);
      pendingAction.onConfirm();
    } else if (pendingAction.type === 'save' && pendingAction.onSave) {
      try {
        await pendingAction.onSave();
        setHasUnsavedChanges(false);
        if (pendingAction.onDiscard) {
          pendingAction.onDiscard();
        }
      } catch (error) {
        // [REMOVED_CONSOLE]
      }
    }
    
    setShowDialog(false);
    setPendingAction(null);
  }, [pendingAction]);

  const handleDiscard = useCallback(() => {
    if (!pendingAction) return;

    setHasUnsavedChanges(false);
    
    if (pendingAction.type === 'navigate' && pendingAction.onConfirm) {
      pendingAction.onConfirm();
    } else if (pendingAction.type === 'save' && pendingAction.onDiscard) {
      pendingAction.onDiscard();
    }
    
    setShowDialog(false);
    setPendingAction(null);
  }, [pendingAction]);

  const handleCancel = useCallback(() => {
    if (pendingAction?.onCancel) {
      pendingAction.onCancel();
    }
    setShowDialog(false);
    setPendingAction(null);
  }, [pendingAction]);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        confirmNavigation,
        promptToSave,
      }}
    >
      {children}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleDiscard}
            >
              Discard Changes
            </Button>
            {pendingAction?.type === 'save' && (
              <AlertDialogAction onClick={handleConfirm}>
                Save & Continue
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  }
  return context;
}