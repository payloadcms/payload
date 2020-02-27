const initCORS = (app, config) => {
  if (config.cors) {
    app.use((req, res, next) => {
      if (config.cors.indexOf(req.headers.origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
      }

      res.header('Access-Control-Allow-Headers',
        'Origin X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Content-Language', config.localization.locale);

      next();
    });
  }
};

module.exports = initCORS;
