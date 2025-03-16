
import * as React from "react";

// Simple toast types
type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: ToastVariant;
  open: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (props: Omit<Toast, "id" | "open">) => { id: string; dismiss: () => void };
  dismiss: (toastId?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

// Generate unique IDs for toasts
let toastCount = 0;
function generateId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

// Provider component for toast context
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  
  // Add a new toast
  const add = React.useCallback((props: Omit<Toast, "id" | "open">) => {
    const id = generateId();
    
    setToasts((toasts) => [
      ...toasts,
      { id, open: true, ...props },
    ]);
    
    return {
      id,
      dismiss: () => dismiss(id),
    };
  }, []);
  
  // Dismiss a toast (or all toasts)
  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((toasts) => 
      toasts.map((toast) => {
        if (toastId === undefined || toast.id === toastId) {
          return { ...toast, open: false };
        }
        return toast;
      })
    );
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      setToasts((toasts) => 
        toasts.filter((toast) => {
          if (toastId === undefined || toast.id === toastId) {
            return false;
          }
          return true;
        })
      );
    }, 1000);
  }, []);
  
  // Listen for toast events from outside React components
  React.useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        add(customEvent.detail);
      }
    };
    
    document.addEventListener('toast-event', handleToastEvent);
    
    return () => {
      document.removeEventListener('toast-event', handleToastEvent);
    };
  }, [add]);
  
  const value = React.useMemo(() => ({
    toasts,
    toast: add,
    dismiss,
  }), [toasts, add, dismiss]);
  
  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}

// Direct toast function for use outside of components
export const toast = (props: Omit<Toast, "id" | "open">) => {
  // Implementation for non-component usage
  const toastEvent = new CustomEvent('toast-event', { detail: props });
  document.dispatchEvent(toastEvent);
  
  return { id: "0", dismiss: () => {} };
};
