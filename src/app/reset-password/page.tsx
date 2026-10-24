'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Geçersiz Sıfırlama Bağlantısı</h2>
        <p className="text-sm text-slate-500">
          Şifre sıfırlama bağlantısı eksik veya geçersiz. Lütfen yeni bir şifre sıfırlama talebinde bulunun.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-2xl hover:bg-teal-700 transition"
        >
          Giriş Sayfasına Dön
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Şifre güncellenemedi.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Şifreniz Başarıyla Güncellendi!</h2>
        <p className="text-sm text-slate-500">
          Yeni şifrenizle giriş yapabilirsiniz. Birkaç saniye içinde giriş sayfasına yönlendiriliyorsunuz...
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-2xl hover:bg-teal-700 transition"
        >
          Hemen Giriş Yap <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
          Yeni Şifre (En az 8 karakter)
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 pl-10 pr-10 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
          />
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-4 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
          Yeni Şifre Tekrar
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 pl-10 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
          />
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Şifre Belirleme</h1>
          <p className="text-xs text-slate-500">
            Hesabınız için yeni ve güvenli bir şifre belirleyin.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-6 text-xs text-slate-400">Yükleniyor...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

