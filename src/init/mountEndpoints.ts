import { Router } from 'express';

import { Payload } from '../index';
import { Endpoint } from '../config/types';

function mountEndpoints(router: Router, endpoints: Endpoint[], ctx: Payload): void {
  endpoints.forEach((endpoint) => {
    endpoint.handlers.forEach((handler) => {
      router[endpoint.method].call(router, endpoint.route, handler.bind(ctx));
    });
  });
}

export default mountEndpoints;
