import { Building2, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-20 md:pb-10 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          {/* Brand */}
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                GAMPÜS
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Öğrenciden Öğrenciye Güvenli ve Ekonomik Kampüs Yaşamı. Komisyonsuz, doğrudan ve doğrulanmış öğrenci ağı.
            </p>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-4 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>.edu.tr Doğrulanmış Öğrenci Güvencesi</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3 text-center md:text-left">
          <p>© {new Date().getFullYear()} GAMPÜS. Tüm hakları saklıdır.</p>
          <p className="flex items-center justify-center gap-1">
            Üniversite öğrencileri için tasarlandı <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
