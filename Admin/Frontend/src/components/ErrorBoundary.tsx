import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Admin Console Error Boundary] Caught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('mandikart_admin_farmers_data');
      localStorage.removeItem('mandikart_approved_listing_ids');
      localStorage.removeItem('mandikart_admin_orders');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h1 className="text-xl font-black text-white mb-2">Admin Console Recovery</h1>
            <p className="text-sm text-slate-400 mb-6">
              A temporary display error occurred. Click below to restore state and refresh the console safely.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-left mb-6 font-mono text-xs text-red-300 overflow-x-auto max-h-32">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Reset Cache & Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
