import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);

  const mostrar = useCallback((tipo, mensaje) => {
    const n = ++id.current;
    setToasts((t) => [...t, { id: n, tipo, mensaje }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n)), 4200);
  }, []);

  const api = useMemo(
    () => ({ ok: (m) => mostrar('ok', m), error: (m) => mostrar('error', m), info: (m) => mostrar('info', m) }),
    [mostrar]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            <span>{t.tipo === 'ok' ? '✅' : t.tipo === 'error' ? '⚠️' : 'ℹ️'}</span>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
