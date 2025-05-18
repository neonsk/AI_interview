import React from 'react';
import { logToFile } from '../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logToFile('React ErrorBoundary', { error: error.toString(), info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-red-600">
          <h2 className="text-2xl font-bold mb-2">予期しないエラーが発生しました</h2>
          <p className="mb-4">ページを再読み込みしてください。問題が解決しない場合はサポートまでご連絡ください。</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
