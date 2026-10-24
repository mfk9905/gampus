'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold mb-4 border border-rose-100">
        !
      </div>
      <h2 className="text-xl font-bold text-slate-900">Bir Hata Oluştu</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        Sayfa yüklenirken beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyiniz.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
        >
          Tekrar Dene
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-100 transition"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
