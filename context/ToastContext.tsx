import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { AppToast, type ToastConfig, type ToastType } from "@/components/AppToast";
import { AppAlert, type AlertConfig, type AlertType, type AlertAction } from "@/components/AppAlert";

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  showAlert: (config: AlertConfig) => void;
  // Convenience methods
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  confirm: (title: string, message: string, actions: AlertAction[]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const toastQueue = useRef<ToastConfig[]>([]);

  const processQueue = useCallback(() => {
    if (toastQueue.current.length > 0 && !toastConfig) {
      const next = toastQueue.current.shift()!;
      setToastConfig(next);
    }
  }, [toastConfig]);

  const showToast = useCallback((config: ToastConfig) => {
    if (toastConfig) {
      // Queue it if one is already showing
      toastQueue.current.push(config);
    } else {
      setToastConfig(config);
    }
  }, [toastConfig]);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(null);
    // Process next in queue after a small delay
    setTimeout(() => processQueue(), 300);
  }, [processQueue]);

  const hideAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string) => {
    showToast({ type: "success", title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: "error", title, message });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: "warning", title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: "info", title, message });
  }, [showToast]);

  const confirm = useCallback((title: string, message: string, actions: AlertAction[]) => {
    showAlert({ type: "confirm", title, message, actions });
  }, [showAlert]);

  return (
    <ToastContext.Provider value={{ showToast, showAlert, success, error, warning, info, confirm }}>
      {children}
      <AppToast config={toastConfig} onHide={hideToast} />
      <AppAlert config={alertConfig} onHide={hideAlert} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
