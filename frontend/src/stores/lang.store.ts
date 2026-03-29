import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import fr from '@/locales/fr/common.json';
import en from '@/locales/en/common.json';

type Lang = 'FR' | 'EN';

const translations: Record<Lang, typeof fr> = { FR: fr, EN: en };

interface LangState {
  lang: Lang;
  hasHydrated: boolean;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setHasHydrated: (hydrated: boolean) => void;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
  const keys = path.split('.');
  let value: unknown = obj;
  for (const key of keys) {
    if (typeof value !== 'object' || value === null) return path;
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === 'string' ? value : path;
};

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'FR',
      hasHydrated: false,
      setLang: (lang) => {
        if (typeof window !== 'undefined') localStorage.setItem('rapide_lang', lang.toLowerCase());
        set({ lang });
      },
      t: (key: string, vars?: Record<string, string | number>) => {
        const { lang } = get();
        let text = getNestedValue(translations[lang] as unknown as Record<string, unknown>, key);
        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            text = text.replace(`{{${k}}}`, String(v));
          });
        }
        return text;
      },
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'rapide-lang',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ lang: state.lang }),
    }
  )
);
