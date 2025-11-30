import { notFound } from 'next/navigation';

const dictionaries = {
    es: () => import('@/locales/es/common.json').then((module) => module.default),
    en: () => import('@/locales/en/common.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale) => {
    if (!dictionaries[locale]) {
        notFound();
    }
    return dictionaries[locale]();
};

export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;
