import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
      <div className="text-5xl font-extrabold text-teal-600 mb-2">404</div>
      <h2 className="text-xl font-bold text-slate-900">Sayfa Bulunamadı</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak erişilemiyor olabilir.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
