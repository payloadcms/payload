/* eslint-disable no-console */
import * as Sentry from '@sentry/node'
import express from 'express'

import type { PluginOptions } from './types'

export const startSentry = (pluginOptions: PluginOptions): any => {
  const { dsn, options } = pluginOptions

  try {
    const app = express()

    Sentry.init({
      ...options?.init,
      dsn: dsn,
      integrations: [
        ...(options?.init?.integrations || []),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      ],
    })

    app.use(Sentry.Handlers.requestHandler(options?.requestHandler || {}) as express.RequestHandler)
    app.use(Sentry.Handlers.tracingHandler())

    app.use(
      Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
          if (error.status === 500) {
            return true
          }
          if (
            options?.captureErrors &&
            typeof error.status === 'number' &&
            options.captureErrors.includes(error.status)
          ) {
            return true
          }
          return false
        },
      }) as express.ErrorRequestHandler,
    )

    app.use(function onError(err, req, res, next) {
      res.statusCode = 500
      res.end(res.sentry + '\n')
    })
  } catch (err: unknown) {
    console.log('There was an error initializing Sentry, please ensure you entered a valid DSN')
  }
}
