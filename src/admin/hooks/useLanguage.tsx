import { useEffect, useState } from 'react';
import i18next from 'i18next';

type Language = string;
type Direction = 'ltr' | 'rtl';

interface UseLanguageResult {
  language: Language;
  direction: Direction;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;

}

const useLanguage = (): UseLanguageResult => {
  const { language: defaultLanguage, dir } = i18next;
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [direction, setDirection] = useState<Direction>(dir(language));

  useEffect(() => {
    const updateLanguageSettings = () => {
      i18next.changeLanguage(language);

      if (!document.documentElement.lang) {
        document.documentElement.lang = language;
      }
      if (!document.documentElement.dir) {
        document.documentElement.dir = dir(language);
      }
      setDirection(dir(language));
    };

    updateLanguageSettings();
  }, [dir, language]);

  return { language, direction, setLanguage };
};

export default useLanguage;
