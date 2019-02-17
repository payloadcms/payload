/**
 * sets request fallbackLocale
 *
 * @param localization
 * @returns {Function}
 */

export default function fallbackLocale(localization) {
  return function (req, res, next) {
// TODO: discuss why this can't be a simple frontend method
    // config: false => false
    // config: false, req: true => false
    // config: true, req: undefined || true => true
    // config: true, req: false => false
    // if (localization.fallback && req.query.fallbackLocale === false) {
    //   req.fallbackLocale = false;
    // } else {
    // req.model.fallbackLocal = true;
    // }

    next();
  }
}
