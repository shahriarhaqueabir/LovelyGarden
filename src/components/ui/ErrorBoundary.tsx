import React from "react";
import {
  ErrorBoundary as ReactErrorBoundary,
  FallbackProps,
} from "react-error-boundary";

const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="flex items-center justify-center h-64 glass-panel rounded-3xl border border-red-500/20 m-4">
      <div className="text-center p-8">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-stone-200 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-stone-400 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-garden-500 text-white rounded-lg hover:bg-garden-600 transition-colors"
        >
          Reload Component
        </button>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
}) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
