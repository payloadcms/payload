import { upsert, fetch } from './requestHandlers';
import setModelLocaleMiddleware from '../localization/setModelLocale';
import bindModelMiddleware from '../mongoose/bindModel';

const registerGlobals = ({ router }, Globals) => {
  router.all('/globals*',
    bindModelMiddleware(Globals),
    setModelLocaleMiddleware());

  router
    .route('/globals')
    .get(fetch);

  router
    .route('/globals/:key')
    .get(fetch)
    .post(upsert)
    .put(upsert);
};

export default registerGlobals;
