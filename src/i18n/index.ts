import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ur } from './ur';

const initialLang =
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage.getItem('language') || 'en'
    : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
