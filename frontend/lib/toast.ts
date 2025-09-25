type ToastFn = (message: string) => void;

function dispatchToast(type: 'success' | 'error' | 'info', message: string) {
  if (typeof window === 'undefined') return;
  try {
    const ev = new CustomEvent('app:toast', { detail: { type, message } });
    window.dispatchEvent(ev);
  } catch {
    // fallback to console
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    // eslint-disable-next-line no-console
    console.log(prefix, message);
  }
}

export const toast = {
  success: ((msg: string) => dispatchToast('success', msg)) as ToastFn,
  error: ((msg: string) => dispatchToast('error', msg)) as ToastFn,
  info: ((msg: string) => dispatchToast('info', msg)) as ToastFn,
};
