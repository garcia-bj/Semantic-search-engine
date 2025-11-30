'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Locale } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLang: Locale;
}

export default function LanguageSelector({ currentLang }: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLang: Locale) => {
    // Replace the language segment in the path
    const segments = pathname.split('/');
    segments[1] = newLang;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <div className="flex gap-2 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-full p-1">
      <button
        onClick={() => switchLanguage('es')}
        className={`px-4 py-2 rounded-full font-medium transition-all ${currentLang === 'es'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
            : 'text-slate-400 hover:text-white'
          }`}
      >
        🇪🇸 ES
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-4 py-2 rounded-full font-medium transition-all ${currentLang === 'en'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
            : 'text-slate-400 hover:text-white'
          }`}
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
