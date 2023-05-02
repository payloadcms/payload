import type { InitOptions } from 'i18next';
import { Handler } from 'express';
declare const i18nMiddleware: (options: InitOptions) => Handler;
export { i18nMiddleware };
