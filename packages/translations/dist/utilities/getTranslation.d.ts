import type { JSX } from 'react';
import { I18n } from '../types';
export declare const getTranslation: (label: JSX.Element | Record<string, string> | string, i18n: Pick<I18n, 'fallbackLanguage' | 'language'>) => string;
