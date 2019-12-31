import express from 'express';

const initUploads = ({ config, app }) => {
  const staticUrl = config.staticUrl ? config.staticUrl : `/${config.staticDir}`;
  app.use(staticUrl, express.static(config.staticDir));
};

export default initUploads;
