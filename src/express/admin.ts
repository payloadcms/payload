import express from 'express';
import compression from 'compression';
import history from 'connect-history-api-fallback';
import path from 'path';
import initWebpack from '../webpack/init';

const router = express.Router();

function initAdmin(): void {
  if (!this.config.admin.disable && process.env.NODE_ENV !== 'test') {
    this.initWebpack = initWebpack.bind(this);

    router.use(history());

    if (process.env.NODE_ENV === 'production') {
      router.get('*', (req, res, next) => {
        if (req.path.substr(-1) === '/' && req.path.length > 1) {
          const query = req.url.slice(req.path.length);
          res.redirect(301, req.path.slice(0, -1) + query);
        } else {
          next();
        }
      });

      router.use(compression(this.config.compression));
      router.use(express.static(path.resolve(process.cwd(), 'build'), { redirect: false }));

      this.express.use(this.config.routes.admin, router);
    } else {
      this.express.use(this.config.routes.admin, history());
      this.express.use(this.initWebpack());
    }
  }
}

export default initAdmin;
