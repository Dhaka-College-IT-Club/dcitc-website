export default function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-white text-black py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}