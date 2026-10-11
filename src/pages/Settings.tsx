import { useTranslation } from 'react-i18next';
import { Settings, Globe, Shield, Database, Sliders } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { t, i18n } = useTranslation();

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    toast.success(`Language switched to ${lang === 'en' ? 'English' : 'Urdu'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#00d4aa]" />
          {t('nav.settings')}
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Platform configurations, language preferences, and database connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selection */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Globe className="w-5 h-5 text-[#00d4aa]" />
            Language & Interface / زبان
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleLangChange('en')}
              className={`p-3 rounded-xl border text-center transition-all ${
                i18n.language === 'en'
                  ? 'bg-[#00d4aa]/10 border-[#00d4aa] text-white font-bold'
                  : 'bg-[#0d1424] border-[#1e2d45] text-[#94a3b8] hover:text-white'
              }`}
            >
              English (LTR)
            </button>

            <button
              onClick={() => handleLangChange('ur')}
              className={`p-3 rounded-xl border text-center transition-all ${
                i18n.language === 'ur'
                  ? 'bg-[#00d4aa]/10 border-[#00d4aa] text-white font-bold'
                  : 'bg-[#0d1424] border-[#1e2d45] text-[#94a3b8] hover:text-white'
              }`}
            >
              اردو (RTL)
            </button>
          </div>
        </div>

        {/* Database & Cloud Persistence */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Database className="w-5 h-5 text-blue-400" />
            Backend Database (Supabase)
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-[#0d1424] border border-[#1e2d45]">
              <span className="text-[#94a3b8]">Supabase Connection:</span>
              <span className={`font-mono font-bold ${
                isSupabaseConfigured ? 'text-green-400' : 'text-amber-400'
              }`}>
                {isSupabaseConfigured ? 'Connected (PostgreSQL)' : 'Local Fallback (Active)'}
              </span>
            </div>

            <p className="text-[11px] text-[#64748b] leading-relaxed">
              When Supabase keys are configured in <code className="text-white">.env</code>, all demo portfolios sync to PostgreSQL with full Row-Level Security (RLS). Otherwise, resilient browser state is used.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
