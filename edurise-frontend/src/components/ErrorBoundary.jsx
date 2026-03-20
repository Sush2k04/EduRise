import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('UI crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-slate-900/60 border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-2">Something crashed in the UI</h2>
            <p className="text-gray-400 mb-4">
              Copy the error text below and send it to me.
            </p>
            <pre className="bg-slate-950/60 border border-purple-500/10 rounded p-3 text-sm overflow-auto">
              {String(this.state.error?.message || this.state.error || 'Unknown error')}
            </pre>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg font-medium"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

