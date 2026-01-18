'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { importDateFNSLocale, t } from '@payloadcms/translations';
import { enUS } from 'date-fns/locale/en-US';
import { useRouter } from 'next/navigation.js';
import React, { createContext, use, useEffect, useState } from 'react';
const Context = /*#__PURE__*/createContext({
  // Use `any` here to be replaced later with a more specific type when used
  i18n: {
    dateFNS: enUS,
    dateFNSKey: 'en-US',
    fallbackLanguage: 'en',
    language: 'en',
    t: key => key,
    translations: {}
  },
  languageOptions: undefined,
  switchLanguage: undefined,
  t: key => undefined
});
export const TranslationProvider = t0 => {
  const $ = _c(18);
  const {
    children,
    dateFNSKey,
    fallbackLang,
    language,
    languageOptions,
    switchLanguageServerAction,
    translations
  } = t0;
  const router = useRouter();
  const [dateFNS, setDateFNS] = useState();
  let t1;
  if ($[0] !== translations) {
    t1 = (key, vars) => t({
      key,
      translations,
      vars
    });
    $[0] = translations;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const nextT = t1;
  let t2;
  if ($[2] !== router || $[3] !== switchLanguageServerAction) {
    t2 = async lang => {
      ;
      try {
        await switchLanguageServerAction(lang);
        router.refresh();
      } catch (t3) {
        const error = t3;
        console.error(`Error loading language: "${lang}"`, error);
      }
    };
    $[2] = router;
    $[3] = switchLanguageServerAction;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const switchLanguage = t2;
  let t3;
  let t4;
  if ($[5] !== dateFNSKey) {
    t3 = () => {
      const loadDateFNS = async () => {
        const imported = await importDateFNSLocale(dateFNSKey);
        setDateFNS(imported);
      };
      loadDateFNS();
    };
    t4 = [dateFNSKey];
    $[5] = dateFNSKey;
    $[6] = t3;
    $[7] = t4;
  } else {
    t3 = $[6];
    t4 = $[7];
  }
  useEffect(t3, t4);
  let t5;
  if ($[8] !== children || $[9] !== dateFNS || $[10] !== dateFNSKey || $[11] !== fallbackLang || $[12] !== language || $[13] !== languageOptions || $[14] !== nextT || $[15] !== switchLanguage || $[16] !== translations) {
    t5 = _jsx(Context, {
      value: {
        i18n: {
          dateFNS,
          dateFNSKey,
          fallbackLanguage: fallbackLang,
          language,
          t: nextT,
          translations
        },
        languageOptions,
        switchLanguage,
        t: nextT
      },
      children
    });
    $[8] = children;
    $[9] = dateFNS;
    $[10] = dateFNSKey;
    $[11] = fallbackLang;
    $[12] = language;
    $[13] = languageOptions;
    $[14] = nextT;
    $[15] = switchLanguage;
    $[16] = translations;
    $[17] = t5;
  } else {
    t5 = $[17];
  }
  return t5;
};
export const useTranslation = () => use(Context);
//# sourceMappingURL=index.js.map