'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, Clock, Info } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      setError('');
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (error && countdown) {
      setError('');
      setCountdown(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Giriş yapılamadı.');
        if (data.retryAfterSeconds) {
          setCountdown(data.retryAfterSeconds);
        }
      } else {
        const dest = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';
        router.push(dest);
        router.refresh();
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      setForgotMessage(data.message || data.error);
    } catch (e) {
      setForgotMessage('Bağlantı hatası.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">UNILIVE Giriş Yap</h1>
          <p className="text-xs text-slate-500">
            Kampüs ilanlarına ve favorilerine erişmek için giriş yap.
          </p>
        </div>

        {redirectParam === '/create-listing' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>İlan oluşturabilmek için lütfen önce hesabınıza giriş yapın.</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {countdown && countdown > 0 && (
              <div className="flex items-center gap-1.5 text-rose-800 font-bold pt-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Kilit açılma süresi: {Math.floor(countdown / 60)}d {countdown % 60}s</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              E-posta Adresi
            </label>
            <div className="relative">
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="ogrenci@universite.edu.tr"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 pl-10 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Şifre
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                Şifremi Unuttum?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                maxLength={100}
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

          <button
            type="submit"
            disabled={loading || (countdown !== null && countdown > 0)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Hesabın yok mu?{' '}
            <Link
              href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
              className="font-bold text-teal-600 hover:underline"
            >
              Hemen Kayıt Ol
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Şifre Sıfırlama</h3>
            <p className="text-xs text-slate-500">
              Kayıtlı e-posta adresinizi girin, sıfırlama bağlantısını e-postanıza gönderelim.
            </p>

            {forgotMessage && (
              <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 rounded-xl text-xs font-semibold">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="ogrenci@universite.edu.tr"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
              />

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700"
                >
                  {forgotLoading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
