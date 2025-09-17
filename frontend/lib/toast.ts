type ToastFn = (message: string) => void;

export const toast = {
  success: ((msg: string) => {
    if (typeof window !== 'undefined') {
      // Replace with your preferred toast library implementation
      console.log('✅', msg);
    }
  }) as ToastFn,
  error: ((msg: string) => {
    if (typeof window !== 'undefined') {
      console.error('❌', msg);
    }
  }) as ToastFn,
  info: ((msg: string) => {
    if (typeof window !== 'undefined') {
      console.info('ℹ️', msg);
    }
  }) as ToastFn,
};
