import middleware from '../middleware';
import mockExpress from 'jest-mock-express';
import locale from '../middleware/locale';

let res = null;
let next = null;
describe('Payload Middleware', () => {
  beforeEach(() => {
    res = mockExpress.response();
    next = jest.fn();
  });


  describe('Payload Role Middleware', () => {
    it('Exact role - authorized', () => {
      const req = {
        user: {
          role: 'user'
        }
      };

      middleware.role('user')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('Exact role - unauthorized', () => {
      const req = {
        user: {
          role: 'user'
        }
      };

      middleware.role('admin')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

  });

  describe('Payload Locale Middleware', () => {

    let req, localization;

    beforeEach(() => {
      req = {
        query: {},
        headers: {}
      };
      localization = {
        languages: ['en', 'es'],
        defaultLanguage: 'en'
      };

    });

    it('Supports query params', () => {
      req.query.locale = 'es';

      locale(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(req.query.locale);
    });

    it('Supports query param fallback to default', () => {
      req.query.lang = 'pt';

      locale(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(localization.defaultLanguage);
    });

    it('Supports accept-language header', () => {
      req.headers['accept-language'] = 'es,fr;';

      locale(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual('es');
    });

    it('Supports accept-language header fallback', () => {
      req.query.locale = 'pt';
      req.headers['accept-language'] = 'fr;';

      locale(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(localization.defaultLanguage);
    });

    it('Query param takes precedence over header', () => {
      req.query.locale = 'es';
      req.headers['accept-language'] = 'en;';

      locale(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual('es');
    });

    it('Supports default language', () => {
      locale(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toEqual(localization.defaultLanguage);
    });

    it('Supports language all', () => {
      req.query.locale = '*';
      locale(localization)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.locale).toBeUndefined();
    });
  });
});
