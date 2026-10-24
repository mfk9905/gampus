'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, log error or send to Sentry without sensitive user data
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold mx-auto border border-rose-100">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-900">Beklenmeyen Bir Hata Oluştu</h1>
          <p className="text-sm text-slate-500">
            Sistemde geçici bir problem meydana geldi. Ekibimiz bilgilendirildi.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => reset()}
              className="w-full px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
            >
              Yeniden Dene
            </button>
            <a
              href="/"
              className="w-full px-5 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-200 transition inline-block"
            >
              Ana Sayfa
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

