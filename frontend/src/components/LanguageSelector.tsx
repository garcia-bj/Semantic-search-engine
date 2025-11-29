'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (locale: string) => {
    const currentPath = pathname.replace(/^\/(es|en)/, '');
    router.push(`/${locale}${currentPath}`);
  };

  const currentLocale = pathname.startsWith('/en') ? 'en' : 'es';

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentLocale}
        onChange={(e) => changeLanguage(e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="es">🇪🇸 Español</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  );
}
