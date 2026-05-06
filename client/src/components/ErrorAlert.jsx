export default function ErrorAlert({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {error}
    </div>
  );
}
