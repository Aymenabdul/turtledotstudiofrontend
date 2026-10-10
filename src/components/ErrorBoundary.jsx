import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Runtime Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-stone-900 font-sans">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200/60 shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">Something went wrong</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              An unexpected error occurred while loading this view. You can reload or return to the main dashboard.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 font-mono text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs rounded-xl flex items-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/admin';
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
