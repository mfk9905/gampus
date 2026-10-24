'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface University {
  id: string;
  name: string;
  shortName: string;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [universityId, setUniversityId] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/universities')
      .then((res) => res.json())
      .then((data) => {
        if (data.universities) setUniversities(data.universities);
      })
      .catch(console.error);
  }, []);

  const handleNameChange = (val: string) => {
    // Only allow letters, spaces, dots, hyphens (no pure numbers)
    const filtered = val.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s\.\-]/g, '').slice(0, 50);
    setName(filtered);
    if (error) setError('');
  };

  const handlePhoneChange = (val: string) => {
    // Only allow digits, plus, spaces, hyphens and parentheses (no letters)
    const filtered = val.replace(/[^0-9+\s()-]/g, '').slice(0, 15);
    setPhone(filtered);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Client-side validations
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError('Ad Soyad en az 2 karakter olmalıdır.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (phone) {
      const phoneRegex = /^(\+90|0)?[5][0-9]{9}$|^(\+?[0-9\s-]{10,15})$/;
      if (!phoneRegex.test(phone.trim())) {
        setError('Geçerli bir telefon numarası giriniz (Örn: 05321234567).');
        return;
      }
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (password.length > 100) {
      setError('Şifre en fazla 100 karakter olabilir.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (!acceptedTerms) {
      setError('Lütfen Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metnini onaylayınız.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          phone: phone.trim() || undefined,
          universityId: universityId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kayıt olunamadı.');
      } else {
        setSuccessMsg(data.message || 'Kayıt başarıyla tamamlandı!');
        setTimeout(() => {
          const dest = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';
          router.push(dest);
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const isEdu = email.trim().toLowerCase().endsWith('.edu.tr');
  const passwordsMatch = password.length >= 8 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">UNILIVE Öğrenci Kaydı</h1>
          <p className="text-xs text-slate-500">
            Üniversite topluluğuna katıl, güvenle ev, oda ve eşya paylaş.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg} Yönlendiriliyorsunuz...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ad Soyad */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Ad Soyad *
              </label>
              <span className="text-[10px] text-slate-400">
                {name.length}/50
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={50}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pl-10 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Yalnızca harf ve boşluk girilebilir (2-50 karakter).
            </span>
          </div>

          {/* E-posta */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                E-posta Adresi *
              </label>
              {isEdu && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  .edu.tr adresi
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.toLowerCase().trim());
                  if (error) setError('');
                }}
                placeholder="ogrenci@itu.edu.tr (veya gmail.com)"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pl-10 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Maksimum 100 karakter. .edu.tr adresleri öğrenci rozetine hak kazanır.
            </span>
          </div>

          {/* Telefon Numarası */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Telefon Numarası (Opsiyonel)
              </label>
              <span className="text-[10px] text-slate-400">
                {phone.length}/15
              </span>
            </div>
            <div className="relative">
              <input
                type="tel"
                maxLength={15}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="05xxxxxxxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pl-10 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Yalnızca rakam girilebilir (Örn: 05321234567).
            </span>
          </div>

          {/* Üniversite */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Üniversiten
            </label>
            <div className="relative">
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pl-10 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="">Üniversite Seçiniz (Opsiyonel)</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Şifre *
              </label>
              <span className={`text-[10px] ${password.length >= 8 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {password.length}/100 (Min 8 karakter)
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={100}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="En az 8 karakter"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pl-10 pr-10 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Şifre Tekrarı */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Şifre Tekrarı *
              </label>
              {passwordsMatch && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Şifreler eşleşiyor
                </span>
              )}
              {passwordsMismatch && (
                <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Şifreler uyuşmuyor
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={100}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Şifrenizi tekrar giriniz"
                className={`w-full bg-slate-50 border rounded-2xl p-3 pl-10 pr-10 text-sm text-slate-800 focus:ring-2 focus:outline-hidden ${
                  passwordsMismatch
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:ring-emerald-500/20'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* KVKK & Sözleşme Onay Kutucuğu */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (error) setError('');
                }}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>
                <strong className="text-slate-800 font-semibold">Kullanıcı Sözleşmesi</strong> ve{' '}
                <strong className="text-slate-800 font-semibold">KVKK Aydınlatma Metnini</strong> okudum, kabul ediyorum.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedTerms || (confirmPassword.length > 0 && password !== confirmPassword)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Zaten hesabın var mı?{' '}
          <Link
            href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            className="font-bold text-emerald-600 hover:underline"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
