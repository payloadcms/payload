import type { Express, Router } from 'express'

import type { Endpoint } from '../config/types'

function mountEndpoints(express: Express, router: Router, endpoints: Endpoint[]): void {
  endpoints.forEach((endpoint) => {
    if (!endpoint.root) {
      router[endpoint.method](endpoint.path, endpoint.handler)
    } else {
      express[endpoint.method](endpoint.path, endpoint.handler)
    }
  })
}

export default mountEndpoints
