import React, { Component, ErrorInfo, ReactNode } from "react";
import { ConnectionError } from "@/components/ConnectionError";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Determine variant based on error type
      const errorMessage = this.state.error?.message?.toLowerCase() || "";
      const isNetwork =
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("fetch");
      const isServer =
        errorMessage.includes("500") ||
        errorMessage.includes("server") ||
        errorMessage.includes("503");

      const variant = isNetwork ? "network" : isServer ? "server" : "generic";

      return (
        <ConnectionError
          variant={variant}
          onRetry={this.handleReset}
          showHomeButton={true}
        />
      );
    }

    return this.props.children;
  }
}
