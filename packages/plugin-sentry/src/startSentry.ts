/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextFunction, Request, Response } from 'express'
import type express from 'express'
import type { Payload } from 'payload'

/* eslint-disable no-console */
import * as Sentry from '@sentry/node'

import type { PluginOptions } from './types'

export const startSentry = (pluginOptions: PluginOptions, payload: Payload): void => {
  const { dsn, options } = pluginOptions
  const { express: app } = payload

  if (!dsn || !app) return

  try {
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

    app.use(function onError(
      _err: unknown,
      _req: Request,
      res: Response & { sentry?: string },
      _next: NextFunction,
    ) {
      res.statusCode = 500
      res.end(res.sentry + '\n')
    })
  } catch (err: unknown) {
    console.log('There was an error initializing Sentry, please ensure you entered a valid DSN')
  }
}
