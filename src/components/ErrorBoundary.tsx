import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-900/30 rounded-xl border border-red-800/50">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-100">System Failure</h1>
            <p className="text-sm text-stone-500">Critical Error Detected</p>
          </div>
        </div>

        <div className="bg-stone-950 rounded-xl p-4 mb-6 border border-stone-800">
          <p className="text-sm text-red-400 font-mono mb-2">Error Message:</p>
          <p className="text-xs text-stone-400 font-mono break-words">
            {error.message}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full py-3 bg-garden-600 hover:bg-garden-500 text-stone-950 font-bold rounded-xl text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Operation
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Base
          </button>
        </div>

        <p className="mt-6 text-xs text-stone-600 text-center">
          If this error persists, please check the console for more details or contact support.
        </p>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, onReset }) => {
  const handleReset = () => {
    onReset?.();
    // Additional cleanup if needed
    console.log('Error boundary reset triggered');
  };

  const handleError = (error: Error, info: React.ErrorInfo) => {
    // Log error to console or send to error reporting service
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', info.componentStack);
    
    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, etc.
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
