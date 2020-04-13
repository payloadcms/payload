const mockExpress = require('jest-mock-express');
const localizationMiddleware = require('../../localization/middleware');

let res = null;
let next = null;
describe('Payload Middleware', () => {
  beforeEach(() => {
    res = mockExpress.response();
    next = jest.fn();
  });

  describe('Payload Locale Middleware', () => {
    let req, localization;

    beforeEach(() => {
      req = {
        query: {},
        headers: {},
        body: {}
      };
      localization = {
        locales: ['en', 'es'],
        defaultLocale: 'en'
      };

    });

    it('Supports query params', () => {
      req.query.locale = 'es';

      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(req.query.locale);
    });

    it('Supports query param fallback to default', () => {
      req.query.locale = 'pt';

      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(localization.defaultLocale);
    });

    it('Supports accept-language header', () => {
      req.headers['accept-language'] = 'es,fr;';

      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual('es');
    });

    it('Supports accept-language header fallback', () => {
      req.query.locale = 'pt';
      req.headers['accept-language'] = 'fr;';

      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(localization.defaultLocale);
    });

    it('Query param takes precedence over header', () => {
      req.query.locale = 'es';
      req.headers['accept-language'] = 'en;';

      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual('es');
    });

    it('Supports default locale', () => {
      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(localization.defaultLocale);
    });

    it('Supports locale all', () => {
      req.query.locale = '*';
      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toBeUndefined();
    });

    it('Supports locale in body on post', () => {
      req.body = {locale: 'es'};
      req.method = 'post';
      localizationMiddleware(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual('es');
    });
  });
});
