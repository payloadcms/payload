import { upsert, fetch } from './requestHandlers';
import setModelLocaleMiddleware from '../localization/setModelLocale';
import bindModelMiddleware from '../mongoose/bindModel';

const registerGlobals = (globals, router) => {
  router.all('/globals*',
    bindModelMiddleware(globals),
    setModelLocaleMiddleware());

  router
    .route('/globals')
    .get(fetch);

  router
    .route('/globals/:slug')
    .get(fetch)
    .post(upsert)
    .put(upsert);
};

export default registerGlobals;
