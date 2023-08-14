import express from 'express';
import compression from 'compression';
import history from 'connect-history-api-fallback';
import initWebpack from '../webpack/init';
import { Payload } from '../payload';

const router = express.Router();

function initAdmin(ctx: Payload): void {
  if (!ctx.config.admin.disable) {
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

      router.use(compression(ctx.config.express.compression));
      router.use(express.static(ctx.config.admin.buildPath, {
        redirect: false,
        setHeaders: (res, path) => {
          const staticFilesRegex = new RegExp('.(svg|css|js|jp(e)?g|png|avif|webp|webm|gif|ico|woff|woff2|ttf|otf)$', 'i');
          if (path.match(staticFilesRegex)) {
            res.set('Cache-Control', `public, max-age=${60 * 60 * 24 * 365}, immutable`);
          }
        },
      }));

      ctx.express.use(ctx.config.routes.admin, router);
    } else {
      ctx.express.use(ctx.config.routes.admin, history());
      ctx.express.use(initWebpack(ctx.config));
    }
  }
}

export default initAdmin;
