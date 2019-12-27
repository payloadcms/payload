import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import localizationMiddleware from '../localization/middleware';

const registerExpressMiddleware = ({ app, config, router }) => {
  app.use(express.json());
  app.use(methodOverride('X-HTTP-Method-Override'));
  app.use(express.urlencoded({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(compression(config.compression));
  app.use(localizationMiddleware(config.localization));
  app.use(router);
};

export default registerExpressMiddleware;
