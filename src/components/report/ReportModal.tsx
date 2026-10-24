'use client';

import { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const REASONS = [
  'Sahte ilan',
  'Dolandırıcılık şüphesi',
  'Uygunsuz içerik',
  'Yanlış bilgi',
  'Ev/Eşya kiralandı ya da satıldı',
  'Diğer',
];

export default function ReportModal({ listingId, listingTitle, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          reason,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Şikayet iletilemedi.');
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError('Bir bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Şikayetiniz Alındı</h3>
            <p className="text-sm text-slate-600">
              Geri bildiriminiz için teşekkür ederiz. İlan yetkililerimiz tarafından incelenip gerekli işlem yapılacaktır.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-800"
            >
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">İlanı Şikayet Et</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{listingTitle}</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Şikayet Nedeni
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:outline-hidden"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Açıklama (Opsiyonel)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detayları belirtebilirsiniz..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-200"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 bg-rose-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-rose-700 shadow-md shadow-rose-600/30 disabled:opacity-50"
              >
                {submitting ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
