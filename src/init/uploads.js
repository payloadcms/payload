import express from 'express';
import fileUpload from 'express-fileupload';
import uploadRoutes from '../uploads/routes';

const initUploads = ({ config, app, router }) => {
  const staticUrl = config.staticUrl ? config.staticUrl : `/${config.staticDir}`;
  app.use(staticUrl, express.static(config.staticDir));
  app.use(fileUpload({}));

  if (config.uploads) {
    app.use(fileUpload({dubug: true}));

    router.use('', uploadRoutes(config));
  }
};

export default initUploads;
