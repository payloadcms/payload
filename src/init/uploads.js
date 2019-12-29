import express from 'express';
import uploadRoutes from '../uploads/routes';

const initUploads = ({ config, app, router }) => {
  const staticUrl = config.staticUrl ? config.staticUrl : `/${config.staticDir}`;
  app.use(staticUrl, express.static(config.staticDir));
  router.use('', uploadRoutes(config, app, router));
};

export default initUploads;
