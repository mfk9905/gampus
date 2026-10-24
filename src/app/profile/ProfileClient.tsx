'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  Smartphone,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Heart,
  PlusCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  Bell,
  Trash2,
  Compass,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProfileClientProps {
  user: any;
}

const CATEGORY_LABELS: Record<string, string> = {
  HOUSE: 'Kiralık Ev',
  ROOM: 'Kiralık Oda',
  ROOMMATE: 'Ev Arkadaşı',
  FURNITURE: '2. El Eşya',
  HOUSE_PACKAGE: 'Ev Paketi',
};

export default function ProfileClient({ user }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'searches'>('profile');
  const [eduEmail, setEduEmail] = useState(
    user.pendingEduEmail || (user.email?.endsWith('.edu.tr') ? user.email : '')
  );
  const [otpCode, setOtpCode] = useState('');
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [studentVerified, setStudentVerified] = useState(user.studentVerified);
  const [allowPhoneCalls, setAllowPhoneCalls] = useState(user.allowPhoneCalls || false);
  const [updatingPhonePref, setUpdatingPhonePref] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Saved Searches state
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'searches') {
      fetchSavedSearches();
    }
  }, [activeTab]);

  const fetchSavedSearches = async () => {
    setSearchesLoading(true);
    try {
      const res = await fetch('/api/saved-searches');
      if (res.ok) {
        const data = await res.json();
        setSavedSearches(data.savedSearches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchesLoading(false);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-searches?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyMessage('');
    setVerifyError('');
    setDevOtpHint(null);

    try {
      const res = await fetch('/api/auth/verify-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eduEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || 'Doğrulama kodu gönderilemedi.');
      } else {
        setVerifyMessage(data.message);
        setShowOtpStep(true);
        if (data.devOtp) {
          setDevOtpHint(data.devOtp);
        }
      }
    } catch (err) {
      setVerifyError('Bağlantı hatası oluştu.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setVerifyError('Lütfen 6 haneli doğrulama kodunu eksiksiz giriniz.');
      return;
    }

    setVerifying(true);
    setVerifyMessage('');
    setVerifyError('');

    try {
      const res = await fetch('/api/auth/verify-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || 'Kod doğrulanamadı.');
      } else {
        setVerifyMessage(data.message);
        setStudentVerified(true);
        setShowOtpStep(false);
        setDevOtpHint(null);
      }
    } catch (err) {
      setVerifyError('Bağlantı hatası oluştu.');
    } finally {
      setVerifying(false);
    }
  };

  const handleTogglePhoneCalls = async (newVal: boolean) => {
    setUpdatingPhonePref(true);
    setAllowPhoneCalls(newVal);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowPhoneCalls: newVal }),
      });
    } catch (e) {
      console.error(e);
      setAllowPhoneCalls(!newVal);
    } finally {
      setUpdatingPhonePref(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Yeni şifre ve şifre tekrarı birbiriyle eşleşmiyor.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Şifre güncellenemedi.');
      } else {
        setPasswordSuccess('Şifreniz başarıyla güncellendi!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setPasswordError('Bağlantı hatası oluştu.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* User Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-teal-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-md border-4 border-white">
              {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </div>
            {studentVerified && (
              <div
                className="absolute bottom-0 right-0 w-7 h-7 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xs"
                title="Doğrulanmış Öğrenci"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-xl">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                {user.university?.name || 'Üniversiteli Öğrenci'}
              </span>
              <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-xl">
                <Mail className="w-4 h-4 text-slate-400" />
                {user.email}
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
              {studentVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-100 border border-teal-300 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  🟢 Öğrenci Doğrulandı
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  ⚠️ Öğrenci Doğrulanmadı
                </span>
              )}

              {user.phoneVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  <Smartphone className="w-4 h-4 text-slate-600" />
                  📱 Telefon Doğrulandı
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Link
            href="/create-listing"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            İlan Ver
          </Link>
          <Link
            href="/dashboard"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            İlanlarım & Favorilerim
          </Link>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'profile' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profil Bilgilerim
        </button>
        <button
          onClick={() => setActiveTab('searches')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'searches' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Kaydedilen Aramalarım
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* EDU EMAIL VERIFICATION SECTION */}
          {!studentVerified && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Öğrenci E-posta Doğrulaması (.edu.tr)</h3>
                  <p className="text-xs text-slate-300">
                    Üniversite e-posta adresinize gönderilen 6 haneli kodu doğrulayarak 🟢 Öğrenci Doğrulandı rozetine hemen sahip olun.
                  </p>
                </div>
              </div>

              {verifyError && (
                <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifyMessage && (
                <div className="bg-teal-500/20 border border-teal-500/40 text-teal-200 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{verifyMessage}</span>
                </div>
              )}

              {devOtpHint && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-2.5 rounded-xl flex items-center justify-between">
                  <span>💡 Test Modu Kodu: <strong>{devOtpHint}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtpHint)}
                    className="underline text-[11px] text-amber-200 hover:text-white cursor-pointer"
                  >
                    Koda Yapıştır
                  </button>
                </div>
              )}

              {!showOtpStep ? (
                <form onSubmit={handleRequestOtp} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    maxLength={100}
                    placeholder="ogrenci@universite.edu.tr"
                    value={eduEmail}
                    onChange={(e) => {
                      setEduEmail(e.target.value);
                      if (verifyError) setVerifyError('');
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500/30 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmOtp} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                      placeholder="6 Haneli Kod (örn: 123456)"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                        if (verifyError) setVerifyError('');
                      }}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-mono tracking-widest text-center text-teal-300 placeholder-slate-500 focus:ring-2 focus:ring-teal-500/30 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={verifying || otpCode.length !== 6}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {verifying ? 'Doğrulanıyor...' : 'Kodu Onayla ve Rozeti Al'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>Kod {eduEmail} adresine iletildi.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpStep(false);
                        setOtpCode('');
                        setVerifyError('');
                      }}
                      className="text-teal-400 hover:underline cursor-pointer"
                    >
                      E-postayı Değiştir / Tekrar Gönder
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* User Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 text-center shadow-xs">
              <div className="text-3xl font-extrabold text-slate-900">{user.listings.length}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Yayınlanan İlanlarım</div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 text-center shadow-xs">
              <div className="text-3xl font-extrabold text-teal-600">{user.favorites.length}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Favorilerim</div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 text-center shadow-xs">
              <div className="text-3xl font-extrabold text-teal-600">
                {user.listings.reduce((acc: number, curr: any) => acc + (curr._count?.contacts || 0), 0)}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase">Gelen İletişim / Talep</div>
            </div>
          </div>

          {/* PRIVACY & COMMUNICATION SETTINGS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Phone className="w-5 h-5 text-teal-600" />
              İletişim & Gizlilik Tercihleri
            </h3>
            <p className="text-xs text-slate-500">
              Gampüs üzerindeki ilanlarınızda telefon numaranızın nasıl görüneceğini belirleyin.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="block text-sm font-bold text-slate-800">Beni Telefonla Arayabilsinler</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Açık olduğunda ilanlarınızda telefon numaranız görünür. Kapalıyken numaranız tamamen gizlenir ve öğrenciler sizinle sadece Gampüs mesajlaşması üzerinden iletişim kurabilir.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  disabled={updatingPhonePref}
                  checked={allowPhoneCalls}
                  onChange={(e) => handleTogglePhoneCalls(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          </div>

          {/* PASSWORD & SECURITY SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Şifre Değiştir</h3>
                <p className="text-xs text-slate-500">
                  Hesabınızın güvenliği için güçlü ve tahmin edilmesi zor bir şifre belirleyin.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mevcut Şifre *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    maxLength={100}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Mevcut şifrenizi giriniz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pr-10 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Yeni Şifre *
                    </label>
                    <span className={`text-[10px] ${newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {newPassword.length}/100
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={100}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="En az 8 karakter"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pr-10 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Yeni Şifre Tekrarı *
                    </label>
                    {newPassword.length >= 8 && confirmNewPassword.length > 0 && newPassword === confirmNewPassword && (
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Eşleşti</span>
                    )}
                    {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
                      <span className="text-[10px] text-rose-500 font-bold">✕ Uyuşmuyor</span>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={100}
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Şifreyi tekrar giriniz"
                    className={`w-full bg-slate-50 border rounded-2xl p-3 text-xs text-slate-900 focus:ring-2 focus:outline-hidden ${
                      confirmNewPassword && newPassword !== confirmNewPassword
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:ring-teal-500/20'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading || newPassword.length < 8 || newPassword !== confirmNewPassword}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED SEARCHES */}
      {activeTab === 'searches' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                Kaydedilen Aramalar ve İlan Alarmları
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kriterlerinize uygun yeni ilanlar eklendiğinde anında bildirim alırsınız.
              </p>
            </div>
          </div>

          {searchesLoading ? (
            <div className="text-center py-8 text-xs text-slate-400">Aramalar yükleniyor...</div>
          ) : savedSearches.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-3xl">🔔</div>
              <div className="text-sm font-bold text-slate-800">Henüz kaydedilmiş bir aramanız yok</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Keşfet sayfasında arama yaptıktan sonra &quot;Aramayı Kaydet&quot; butonuna basarak ilan alarmları oluşturabilirsiniz.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition"
              >
                <Compass className="w-4 h-4" />
                İlanları Keşfet
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-3">
              {savedSearches.map((s) => {
                const params = new URLSearchParams();
                if (s.category) params.set('category', s.category);
                if (s.universityId) params.set('universityId', s.universityId);
                if (s.district) params.set('district', s.district);
                if (s.minPrice) params.set('minPrice', s.minPrice.toString());
                if (s.maxPrice) params.set('maxPrice', s.maxPrice.toString());
                if (s.condition) params.set('condition', s.condition);

                return (
                  <div key={s.id} className="pt-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-1">
                        {s.category && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            Kategori: {CATEGORY_LABELS[s.category] || s.category}
                          </span>
                        )}
                        {s.district && <span className="bg-slate-100 px-2 py-0.5 rounded">İlçe: {s.district}</span>}
                        {(s.minPrice || s.maxPrice) && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            Fiyat: {s.minPrice || 0} TL - {s.maxPrice || '∞'} TL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/explore?${params.toString()}`}
                        className="px-3 py-1.5 bg-teal-50 text-teal-800 rounded-xl text-xs font-bold hover:bg-teal-100"
                      >
                        Sonuçları Gör
                      </Link>
                      <button
                        onClick={() => handleDeleteSearch(s.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Aramayı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

