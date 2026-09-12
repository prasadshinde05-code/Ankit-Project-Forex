export function Card({ children, className = "", style }) {
  return (
    <div className={`bg-white border border-line rounded-xl p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Btn({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-navy text-white",
    gold: "bg-gold text-navy",
    outline: "bg-white text-navy border border-line",
    danger: "bg-white text-danger border border-danger",
    ghost: "bg-transparent text-muted",
  };
  return (
    <button
      className={`px-4 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, style }) {
  return (
    <label className="block mb-4" style={style}>
      <span className="block text-xs font-semibold text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-line text-sm text-ink outline-none focus:ring-2 focus:ring-gold/50 bg-white";

export function Badge({ children, tone = "muted" }) {
  const tones = {
    muted: "bg-slate-100 text-muted",
    gold: "bg-amber-50 text-amber-800",
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-danger",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ progress }) {
  return (
    <div className="w-full h-2 bg-offwhite rounded-full overflow-hidden">
      <div className="h-full bg-gold" style={{ width: `${Math.round(progress * 100)}%` }} />
    </div>
  );
}
