import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import or from './locales/or.json';
import mr from './locales/mr.json';
import kn from './locales/kn.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  or: { translation: or },
  mr: { translation: mr },
  kn: { translation: kn },
  fr: { translation: fr },
  ja: { translation: ja },
  es: { translation: es }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
