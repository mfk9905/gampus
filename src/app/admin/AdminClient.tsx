'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Building2,
  GraduationCap,
  List,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Eye,
  Trash2,
  TrendingUp,
  Search,
  ShieldCheck,
  Ban,
  Check,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
  History,
  FileText
} from 'lucide-react';

interface AdminClientProps {
  stats: any;
  reports: any[];
  universities: any[];
  listings: any[];
  users: any[];
  auditLogs?: any[];
}

const CATEGORY_LABELS: Record<string, string> = {
  HOUSE: 'Kiralık Ev',
  ROOM: 'Kiralık Oda',
  ROOMMATE: 'Ev Arkadaşı',
  FURNITURE: '2. El Eşya',
  HOUSE_PACKAGE: 'Ev Paketi',
};

const PAGE_SIZE = 15;

export default function AdminClient({
  stats,
  reports: initialReports,
  universities: initialUniversities,
  listings: initialListings,
  users: initialUsers,
  auditLogs: initialAuditLogs = [],
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'universities' | 'reports' | 'audit'>('overview');
  
  const [usersList, setUsersList] = useState(initialUsers);
  const [listingsList, setListingsList] = useState(initialListings);
  const [universitiesList, setUniversitiesList] = useState(initialUniversities);
  const [reportsList, setReportsList] = useState(initialReports);
  const [auditLogsList, setAuditLogsList] = useState(initialAuditLogs);

  // Pagination & Search States
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  const [listingSearch, setListingSearch] = useState('');
  const [listingPage, setListingPage] = useState(1);

  // University Form State (Add & Edit)
  const [uniName, setUniName] = useState('');
  const [uniShort, setUniShort] = useState('');
  const [uniCity, setUniCity] = useState('İstanbul');
  const [uniDistrict, setUniDistrict] = useState('');
  const [addingUni, setAddingUni] = useState(false);
  const [editingUni, setEditingUni] = useState<any | null>(null);
  const [updatingUni, setUpdatingUni] = useState(false);

  // Report resolution loading
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);

  // Toggle User verification
  const handleToggleUserVerification = async (userId: string, field: 'studentVerified' | 'phoneVerified', currentValue: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, [field]: !currentValue }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, [field]: !currentValue } : u))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle User Ban
  const handleToggleBan = async (userId: string, isCurrentlyBanned: boolean) => {
    const confirmMsg = isCurrentlyBanned
      ? 'Kullanıcının yasağını kaldırmak istediğinize emin misiniz?'
      : 'Bu kullanıcıyı sistemden süresiz yasaklamak istediğinize emin misiniz? (Giriş yapamayacaktır)';
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBanned: !isCurrentlyBanned }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, lockedUntil: isCurrentlyBanned ? null : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) }
              : u
          )
        );
      } else {
        alert(data.error || 'İşlem başarısız.');
      }
    } catch (e) {
      console.error(e);
      alert('Bağlantı hatası.');
    }
  };

  // Toggle User Role (USER <-> ADMIN)
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Kullanıcının rolünü "${nextRole}" yapmak istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Feature Listing
  const handleToggleFeature = async (listingId: string, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      if (res.ok) {
        setListingsList((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, featured: !currentFeatured } : l))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Listing
  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Bu ilanı tamamen silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      if (res.ok) {
        setListingsList((prev) => prev.filter((l) => l.id !== listingId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add University
  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniName || !uniShort || !uniDistrict) return;
    setAddingUni(true);

    try {
      const res = await fetch('/api/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uniName,
          shortName: uniShort,
          city: uniCity,
          district: uniDistrict,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUniversitiesList([...universitiesList, data.university]);
        setUniName('');
        setUniShort('');
        setUniDistrict('');
      } else {
        alert(data.error || 'Üniversite eklenemedi.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingUni(false);
    }
  };

  // Update University
  const handleUpdateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUni) return;
    setUpdatingUni(true);

    try {
      const res = await fetch('/api/universities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUni),
      });
      const data = await res.json();
      if (res.ok) {
        setUniversitiesList((prev) =>
          prev.map((u) => (u.id === editingUni.id ? { ...u, ...editingUni } : u))
        );
        setEditingUni(null);
      } else {
        alert(data.error || 'Üniversite güncellenemedi.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingUni(false);
    }
  };

  // Delete University
  const handleDeleteUniversity = async (id: string, name: string) => {
    if (!confirm(`"${name}" üniversitesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;

    try {
      const res = await fetch(`/api/universities?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setUniversitiesList((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert(data.error || 'Üniversite silinemedi.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Report Status
  const handleUpdateReportStatus = async (reportId: string, status: 'RESOLVED' | 'DISMISSED' | 'REVIEWING') => {
    setResolvingReportId(reportId);
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setReportsList((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status, resolvedAt: new Date().toISOString() } : r))
        );
      } else {
        alert(data.error || 'Şikayet durumu güncellenemedi.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingReportId(null);
    }
  };

  // Filtered & Paginated Users
  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.university?.name && u.university.name.toLowerCase().includes(q))
    );
  });
  const totalUserPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  // Filtered & Paginated Listings
  const filteredListings = listingsList.filter((l) => {
    const q = listingSearch.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.district.toLowerCase().includes(q) ||
      (l.user?.name && l.user.name.toLowerCase().includes(q))
    );
  });
  const totalListingPages = Math.ceil(filteredListings.length / PAGE_SIZE) || 1;
  const paginatedListings = filteredListings.slice((listingPage - 1) * PAGE_SIZE, listingPage * PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            <span>UNILIVE Yönetim Paneli</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sistem ve Platform Yönetimi
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Kullanıcılar, ilanlar, üniversite verileri, şikayetler ve denetim günlükleri.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          İstatistikler
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Kullanıcılar ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'listings'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <List className="w-4 h-4" />
          İlan Yönetimi ({listingsList.length})
        </button>

        <button
          onClick={() => setActiveTab('universities')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'universities'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Üniversiteler ({universitiesList.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Şikayetler ({reportsList.filter((r) => r.status === 'PENDING').length} Bekleyen)
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Denetim Günlükleri ({auditLogsList.length})
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Kullanıcı</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">{stats.totalListings}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Toplam İlan</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="text-2xl font-black text-teal-600">{stats.activeListings}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Aktif İlanlar</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="text-2xl font-black text-blue-600">{stats.newTodayListings}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Bugün Eklendi</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="text-2xl font-black text-purple-600">{stats.verifiedStudents}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Doğrulanmış Öğrenci</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="text-2xl font-black text-rose-600">{stats.pendingReports}</div>
              <div className="text-xs font-bold text-slate-500 uppercase">Bekleyen Şikayet</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-lg">Platform Durumu</h3>
            <p className="text-xs text-slate-500">
              UNILIVE veritabanında aktif durumda {stats.activeListings} ilan ve {stats.verifiedStudents} .edu.tr onaylı öğrenci bulunmaktadır.
            </p>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-extrabold text-slate-900 text-base">Kayıtlı Kullanıcılar ({filteredUsers.length})</h3>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Kullanıcı veya e-posta ara..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold">
                  <th className="py-3 px-2">Kullanıcı</th>
                  <th className="py-3 px-2">E-posta</th>
                  <th className="py-3 px-2">Üniversite</th>
                  <th className="py-3 px-2">Rol</th>
                  <th className="py-3 px-2">Öğrenci Rozeti</th>
                  <th className="py-3 px-2">Durum (Yasak)</th>
                  <th className="py-3 px-2 text-right">Eylemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedUsers.map((u) => {
                  const isBanned = Boolean(u.lockedUntil && new Date(u.lockedUntil) > new Date());
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                          {u.name ? u.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {u._count?.listings > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal">{u._count.listings} İlan</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">{u.email}</td>
                      <td className="py-3 px-2">{u.university?.shortName || '-'}</td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition ${
                            u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Rolü Değiştir (Tıkla)"
                        >
                          {u.role === 'ADMIN' ? '👑 Yönetici' : 'Öğrenci'}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleToggleUserVerification(u.id, 'studentVerified', u.studentVerified)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            u.studentVerified ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {u.studentVerified ? '🟢 Onaylı' : '⚪ Onaysız'}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        {isBanned ? (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-800">
                            🚫 Yasaklı
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700">
                            ✓ Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right space-x-2">
                        <button
                          onClick={() => handleToggleBan(u.id, isBanned)}
                          className={`px-2.5 py-1 rounded-xl font-bold text-[10px] transition cursor-pointer ${
                            isBanned
                              ? 'bg-slate-800 hover:bg-slate-900 text-white'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isBanned ? 'Yasağı Kaldır' : 'Yasakla (Ban)'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* User Pagination */}
          {totalUserPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>Toplam {filteredUsers.length} kullanıcıdan {(userPage - 1) * PAGE_SIZE + 1} - {Math.min(userPage * PAGE_SIZE, filteredUsers.length)} arası</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-800">Sayfa {userPage} / {totalUserPages}</span>
                <button
                  disabled={userPage >= totalUserPages}
                  onClick={() => setUserPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-extrabold text-slate-900 text-base">Yayınlanan İlanlar ({filteredListings.length})</h3>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="İlan başlığı veya ilçe ara..."
                value={listingSearch}
                onChange={(e) => {
                  setListingSearch(e.target.value);
                  setListingPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold">
                  <th className="py-3 px-2">İlan</th>
                  <th className="py-3 px-2">Kategori</th>
                  <th className="py-3 px-2">Fiyat</th>
                  <th className="py-3 px-2">İlçe</th>
                  <th className="py-3 px-2">Öne Çıkarma</th>
                  <th className="py-3 px-2 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedListings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold text-slate-900 max-w-xs truncate">
                      <Link href={`/listings/${l.id}`} className="hover:text-emerald-600">
                        {l.title}
                      </Link>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        İlan Sahibi: {l.user?.name || 'Bilinmiyor'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {CATEGORY_LABELS[l.category] || l.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-900">
                      ₺{l.price}
                    </td>
                    <td className="py-3 px-2">{l.district}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleToggleFeature(l.id, l.featured || false)}
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                          l.featured ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {l.featured ? '⭐ Öne Çıkarıldı' : 'Normal'}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <Link
                        href={`/listings/${l.id}`}
                        className="p-1 text-slate-500 hover:text-emerald-600 inline-block"
                        title="İlanı Görüntüle"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </Link>
                      <Link
                        href={`/listings/${l.id}/edit`}
                        className="p-1 text-slate-500 hover:text-teal-600 inline-block"
                        title="İlanı Düzenle"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </Link>
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="İlanı Sil"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Listing Pagination */}
          {totalListingPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>Toplam {filteredListings.length} ilandan {(listingPage - 1) * PAGE_SIZE + 1} - {Math.min(listingPage * PAGE_SIZE, filteredListings.length)} arası</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={listingPage <= 1}
                  onClick={() => setListingPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-800">Sayfa {listingPage} / {totalListingPages}</span>
                <button
                  disabled={listingPage >= totalListingPages}
                  onClick={() => setListingPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UNIVERSITIES TAB */}
      {activeTab === 'universities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add / Edit Uni Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base">
              {editingUni ? 'Üniversiteyi Düzenle' : 'Yeni Üniversite Ekle'}
            </h3>
            
            {editingUni ? (
              <form onSubmit={handleUpdateUniversity} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Üniversite Adı *</label>
                  <input
                    type="text"
                    required
                    value={editingUni.name}
                    onChange={(e) => setEditingUni({ ...editingUni, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kısaltma *</label>
                  <input
                    type="text"
                    required
                    value={editingUni.shortName}
                    onChange={(e) => setEditingUni({ ...editingUni, shortName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">İlçe *</label>
                  <input
                    type="text"
                    required
                    value={editingUni.district}
                    onChange={(e) => setEditingUni({ ...editingUni, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    required
                    value={editingUni.city || 'İstanbul'}
                    onChange={(e) => setEditingUni({ ...editingUni, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingUni(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={updatingUni}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition"
                  >
                    {updatingUni ? 'Kaydediliyor...' : 'Güncelle'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddUniversity} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Üniversite Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Galatasaray Üniversitesi"
                    value={uniName}
                    onChange={(e) => setUniName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kısaltma *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: GSÜ"
                    value={uniShort}
                    onChange={(e) => setUniShort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">İlçe *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Beşiktaş"
                    value={uniDistrict}
                    onChange={(e) => setUniDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingUni}
                  className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  {addingUni ? 'Ekleniyor...' : 'Üniversiteyi Kaydet'}
                </button>
              </form>
            )}
          </div>

          {/* Uni List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base">Kayıtlı Üniversiteler ({universitiesList.length})</h3>
            <div className="divide-y divide-slate-100 text-xs max-h-[600px] overflow-y-auto">
              {universitiesList.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900">{u.name} ({u.shortName})</span>
                    <span className="text-slate-400 block">{u.district}, {u.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-xl">
                      {u._count?.listings || 0} İlan
                    </span>
                    <button
                      onClick={() => setEditingUni(u)}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUniversity(u.id, u.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Bildirilen Şikayetler ({reportsList.length})
            </h3>
          </div>

          {reportsList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Bekleyen şikayet bulunmamaktadır.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {reportsList.map((rep) => {
                const isPending = rep.status === 'PENDING';
                const isResolved = rep.status === 'RESOLVED';
                const isDismissed = rep.status === 'DISMISSED';

                return (
                  <div key={rep.id} className="py-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                          Nedeni: {rep.reason}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDismissed
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isPending
                            ? '⏳ Beklemede'
                            : isResolved
                            ? '✅ Çözüldü'
                            : isDismissed
                            ? '✕ Kapatıldı'
                            : '🔍 İnceleniyor'}
                        </span>
                      </div>
                      <span className="text-slate-400">
                        {new Date(rep.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="text-slate-800 font-semibold">
                      İlan: {rep.listing?.title || 'Silinmiş İlan'}
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-4">
                      <span>Bildiren: <strong>{rep.reporter?.name || 'Anonim'}</strong> ({rep.reporter?.email || '-'})</span>
                      {rep.reported && (
                        <span>Şikayet Edilen: <strong className="text-rose-600">{rep.reported.name}</strong> ({rep.reported.email || '-'})</span>
                      )}
                    </div>

                    {rep.description && (
                      <div className="bg-slate-50 p-3 rounded-xl text-slate-600 italic border border-slate-100">
                        &quot;{rep.description}&quot;
                      </div>
                    )}

                    {rep.chatExcerpt && (
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                        <div className="text-amber-400 font-bold mb-1">📜 Şikayet Edilen Sohbet Dökümü:</div>
                        {rep.chatExcerpt}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                        {rep.listing && (
                          <>
                            <Link
                              href={`/listings/${rep.listing.id}`}
                              className="text-emerald-600 hover:underline font-bold"
                            >
                              İlanı İncele
                            </Link>
                            <button
                              onClick={() => handleDeleteListing(rep.listing.id)}
                              className="text-rose-600 hover:underline font-bold cursor-pointer"
                            >
                              İlanı Kaldır (Sil)
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {rep.status !== 'RESOLVED' && (
                          <button
                            disabled={resolvingReportId === rep.id}
                            onClick={() => handleUpdateReportStatus(rep.id, 'RESOLVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Çözüldü Olarak İşaretle
                          </button>
                        )}
                        {rep.status !== 'DISMISSED' && (
                          <button
                            disabled={resolvingReportId === rep.id}
                            onClick={() => handleUpdateReportStatus(rep.id, 'DISMISSED')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Asılsız / Kapat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Yönetici Denetim Günlükleri (Audit Logs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin paneli üzerinden gerçekleştirilen tüm kritik işlemler bu alanda kayıt altına alınır.
              </p>
            </div>
          </div>

          {auditLogsList.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">Henüz denetim kaydı bulunmuyor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold">
                    <th className="py-3 px-2">İşlem (Eylem)</th>
                    <th className="py-3 px-2">Yönetici</th>
                    <th className="py-3 px-2">Hedef Türü</th>
                    <th className="py-3 px-2">Hedef ID</th>
                    <th className="py-3 px-2">Detay / Metadata</th>
                    <th className="py-3 px-2 text-right">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {auditLogsList.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900">{log.admin?.name || 'Sistem'}</div>
                        <div className="text-[10px] text-slate-400">{log.admin?.email}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-indigo-700 font-semibold">{log.targetType}</span>
                      </td>
                      <td className="py-3 px-2 font-mono text-[10px] text-slate-500">
                        {log.targetId || '-'}
                      </td>
                      <td className="py-3 px-2 max-w-xs truncate text-slate-500 font-mono text-[10px]">
                        {log.metadata || '-'}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
