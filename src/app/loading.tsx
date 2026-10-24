export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-600">Yükleniyor...</p>
    </div>
  );
}
