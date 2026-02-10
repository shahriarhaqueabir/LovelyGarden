import toast from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const getToastStyle = (type: ToastType) => {
  const baseStyle = {
    background: '#1c1917',
    color: '#e7e5e4',
    border: '1px solid #292524',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
  };

  switch (type) {
    case 'success':
      return { ...baseStyle, borderLeft: '4px solid #22c55e' };
    case 'error':
      return { ...baseStyle, borderLeft: '4px solid #ef4444' };
    case 'warning':
      return { ...baseStyle, borderLeft: '4px solid #f59e0b' };
    case 'info':
    default:
      return { ...baseStyle, borderLeft: '4px solid #3b82f6' };
  }
};

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
    default:
      return 'ℹ️';
  }
};

export const showToast = (message: string, type: ToastType = 'info') => {
  toast(message, {
    icon: getIcon(type),
    style: getToastStyle(type),
    duration: 3000,
    position: 'top-right',
  });
};

export const showSuccess = (message: string) => showToast(message, 'success');
export const showError = (message: string) => showToast(message, 'error');
export const showInfo = (message: string) => showToast(message, 'info');
export const showWarning = (message: string) => showToast(message, 'warning');

export { toast };
