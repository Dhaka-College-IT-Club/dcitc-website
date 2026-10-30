export default function Field({
  label,
  error,
  ...props
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? props.name;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
        {...props}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}