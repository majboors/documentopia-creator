
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, toast } = useToast();

  // Handle direct toast calls from outside of React components
  useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      if (event.detail) {
        toast(event.detail);
      }
    };

    // Add event listener
    document.addEventListener('toast', handleToastEvent as EventListener);

    // Clean up
    return () => {
      document.removeEventListener('toast', handleToastEvent as EventListener);
    };
  }, [toast]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
