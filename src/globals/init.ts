import express from 'express';
import buildModel from './buildModel';

function initGlobals() {
  if (this.config.globals) {
    this.globals = {
      Model: buildModel(this.config),
      config: this.config.globals,
    };

    // If not local, open routes
    if (!this.config.local) {
      const router = express.Router();

      this.config.globals.forEach((global) => {
        router
          .route(`/globals/${global.slug}`)
          .get(this.requestHandlers.globals.findOne(global))
          .post(this.requestHandlers.globals.update(global));
      });

      this.router.use(router);
    }
  }
}

export default initGlobals;
