import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

let toastListeners: ((t: ToastMessage) => void)[] = [];

export function showToast(text: string, type: ToastMessage["type"] = "info") {
  const msg: ToastMessage = { id: Date.now().toString(), text, type };
  toastListeners.forEach((fn) => fn(msg));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter((x) => x !== handler); };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const colors = {
          success: "bg-emerald-600 text-white",
          error: "bg-red-600 text-white",
          info: "bg-slate-800 text-white",
        };
        return (
          <div
            key={t.id}
            className={`${colors[t.type]} px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 animate-slide-in`}
          >
            <span className="flex-1">{t.text}</span>
            <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
          </div>
        );
      })}
    </div>
  );
}
