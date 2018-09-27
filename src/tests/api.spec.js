import request from 'supertest';
import * as payload from '../index';
import * as utils from './testUtils';
import httpStatus from 'http-status';

describe('API tests', () => {
  test('Mounts /health-check route', (done) => {
    const expressApp = utils.getConfiguredExpress();
    payload.init(expressApp);

    let server = expressApp.listen(3000);
    request(expressApp)
      .get('/health-check')
      .then(res => {
        expect(res.statusCode).toEqual(httpStatus.OK);
        server.close();
        done();
    });
  });
});
