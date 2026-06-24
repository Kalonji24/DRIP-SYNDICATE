export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="h-8 w-8 border-2 border-bone/20 border-t-blood rounded-full animate-spin" />
      {label && <p className="text-ash text-sm">{label}</p>}
    </div>
  );
}
