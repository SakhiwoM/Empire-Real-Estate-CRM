export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}
