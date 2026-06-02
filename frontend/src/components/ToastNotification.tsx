'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, Bell, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'notification';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  body?: string;
}

interface ToastProps {
  toasts: Toast[];
  remove: (id: string) => void;
}

const ICONS = {
  success:      { Icon: CheckCircle,  color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  error:        { Icon: AlertCircle,  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  info:         { Icon: Info,         color: '#097DE9', bg: 'rgba(9,125,233,0.08)',  border: 'rgba(9,125,233,0.2)'   },
  notification: { Icon: Bell,         color: '#097DE9', bg: 'rgba(9,125,233,0.1)',   border: 'rgba(9,125,233,0.2)'   },
};

export function ToastContainer({ toasts, remove }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const { Icon, color, bg, border } = ICONS[t.type];
        return (
          <div key={t.id}
            className="flex items-start gap-3 p-4 rounded-2xl pointer-events-auto animate-fade-in-up shadow-2xl glass"
            style={{ border: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-100">{t.title}</p>
              {t.body && <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">{t.body}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-300 flex-shrink-0 cursor-pointer transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Hook for using toasts anywhere
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((toast: Omit<Toast, 'id'>, durationMs = 5000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), durationMs);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, add, remove };
}

// Standalone status-change push notification simulator for the tracker page
export function usePushNotificationSimulator(
  addToast: (t: Omit<Toast, 'id'>) => void,
  applicationStatus: string
) {
  useEffect(() => {
    if (!applicationStatus) return;

    const messages: Record<string, { title: string; body: string }> = {
      Verified: { title: 'Pembayaran Dikonfirmasi ✅', body: 'Permohonan paspor Anda sedang diproses.' },
      Printing: { title: 'Paspor Sedang Dicetak 🖨️', body: 'Paspor Anda sedang dalam tahap percetakan.' },
      Ready:    { title: 'Paspor Siap Diambil 🎉',   body: 'Kunjungi kantor imigrasi untuk mengambil paspor Anda.' },
    };

    const msg = messages[applicationStatus];
    if (msg) {
      const timer = setTimeout(() => {
        addToast({ type: 'notification', ...msg });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [applicationStatus, addToast]);
}
