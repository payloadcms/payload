import { Router } from 'express';
import { Endpoint } from '../config/types';

function mountEndpoints(router: Router, endpoints: Endpoint[]): void {
  endpoints.forEach((endpoint) => {
    router[endpoint.method](endpoint.path, endpoint.handler);
  });
}

export default mountEndpoints;
