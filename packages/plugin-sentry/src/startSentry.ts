/* eslint-disable no-console */
import * as Sentry from '@sentry/node'
import express from 'express'

import type { PluginOptions } from './types'

export const startSentry = (pluginOptions: PluginOptions): any => {
  const { dsn, options } = pluginOptions

  try {
    const app = express()

    Sentry.init({
      dsn: dsn,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      ],
      ...options,
    })

    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())
    app.use(
      Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
          if (error.status === 404 || error.status === 500) {
            return true
          }
          return false
        },
      }),
    )
    app.use(Sentry.Handlers.requestHandler())
    app.get('/', function rootHandler(req, res) {
      res.end('Sentry running')
    })

    app.use(function onError(err, req, res, next) {
      res.statusCode = 500
      res.end(res.sentry + '\n')
    })
  } catch (err: unknown) {
    console.log('There was an error initializing Sentry, please ensure you entered a valid DSN')
  }
}
