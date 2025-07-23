// hooks/useToast.ts
import { toast } from 'sonner';

export const useToast = () => {
  const success = (message: string, options = {}) =>
    toast.success(message, options);

  const error = (message: string, options = {}) =>
    toast.error(message, options);

  const info = (message: string, options = {}) =>
    toast(message, { ...options, icon: 'ℹ️' });

  const loading = (message: string, options = {}) =>
    toast.loading(message, options);

  const dismiss = (toastId?: string) => toast.dismiss(toastId);

  return { success, error, info, loading, dismiss };
};
