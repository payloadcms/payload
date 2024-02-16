import httpStatus from 'http-status'
import type { Collection, GlobalConfig, PayloadRequest, SanitizedConfig } from 'payload/types'
import type { Endpoint } from 'payload/config'
import { match } from 'path-to-regexp'

import { createPayloadRequest } from '../../utilities/createPayloadRequest'
import {
  CollectionRouteHandler,
  CollectionRouteHandlerWithID,
  GlobalRouteHandler,
  GlobalRouteHandlerWithID,
} from './types'

import { RouteError } from './RouteError'
import { endpointsAreDisabled } from './checkEndpoints'

import { me } from './auth/me'
import { init } from './auth/init'
import { login } from './auth/login'
import { unlock } from './auth/unlock'
import { access } from './auth/access'
import { logout } from './auth/logout'
import { refresh } from './auth/refresh'

import { find } from './collections/find'
import { create } from './collections/create'
import { update } from './collections/update'
import { deleteDoc } from './collections/delete'
import { verifyEmail } from './auth/verifyEmail'
import { findByID } from './collections/findByID'
import { docAccess } from './collections/docAccess'
import { resetPassword } from './auth/resetPassword'
import { updateByID } from './collections/updateByID'
import { deleteByID } from './collections/deleteByID'
import { forgotPassword } from './auth/forgotPassword'
import { findVersions } from './collections/findVersions'
import { registerFirstUser } from './auth/registerFirstUser'
import { restoreVersion } from './collections/restoreVersion'
import { findVersionByID } from './collections/findVersionByID'

import { findOne } from './globals/findOne'
import { update as updateGlobal } from './globals/update'
import { docAccess as docAccessGlobal } from './globals/docAccess'
import { findVersions as findVersionsGlobal } from './globals/findVersions'
import { restoreVersion as restoreVersionGlobal } from './globals/restoreVersion'
import { findVersionByID as findVersionByIdGlobal } from './globals/findVersionByID'

const endpoints = {
  root: {
    GET: {
      access,
    },
  },
  collection: {
    GET: {
      init,
      me,
      versions: findVersions,
      find,
      findByID,
      'doc-access-by-id': docAccess,
      'doc-versions-by-id': findVersionByID,
    },
    POST: {
      create,
      login,
      logout,
      unlock,
      access: docAccess,
      'first-register': registerFirstUser,
      'forgot-password': forgotPassword,
      'reset-password': resetPassword,
      'refresh-token': refresh,
      'doc-access-by-id': docAccess,
      'doc-versions-by-id': restoreVersion,
      'doc-verify-by-id': verifyEmail,
    },
    PATCH: {
      update,
      updateByID,
    },
    DELETE: {
      delete: deleteDoc,
      deleteByID,
    },
  },
  global: {
    GET: {
      findOne,
      'doc-access': docAccessGlobal,
      'doc-versions': findVersionsGlobal,
      'doc-versions-by-id': findVersionByIdGlobal,
    },
    POST: {
      update: updateGlobal,
      'doc-access': docAccessGlobal,
      'doc-versions-by-id': restoreVersionGlobal,
    },
  },
}

const handleCustomEndpoints = ({
  entitySlug,
  endpoints,
  payloadRequest,
}: {
  entitySlug?: string
  endpoints: Endpoint[] | GlobalConfig['endpoints']
  payloadRequest: PayloadRequest
}): Promise<Response> | Response => {
  if (endpoints && endpoints.length > 0) {
    let handlerParams = {}
    const { pathname } = payloadRequest
    const pathPrefix =
      payloadRequest.payload.config.routes.api + (entitySlug ? `/${entitySlug}` : '')

    const customEndpoint = endpoints.find((endpoint) => {
      if (endpoint.method === payloadRequest.method.toLowerCase()) {
        const pathMatchFn = match(`${pathPrefix}${endpoint.path}`, {
          decode: decodeURIComponent,
        })
        const tempParams = pathMatchFn(pathname)
        if (tempParams) {
          handlerParams = tempParams.params
          return true
        }
      }
    })

    if (customEndpoint) {
      return customEndpoint.handler({
        req: payloadRequest,
        routeParams: handlerParams,
      })
    }
  }

  return null
}

const RouteNotFoundResponse = (slug: string[]) =>
  Response.json(
    {
      message: `Route Not Found: "${slug.join('/')}"`,
    },
    { status: httpStatus.NOT_FOUND },
  )

export const GET =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (request: Request, { params: { slug } }: { params: { slug: string[] } }) => {
    const [slug1, slug2, slug3, slug4] = slug
    let req: PayloadRequest
    let res: Response
    let collection: Collection

    try {
      req = await createPayloadRequest({
        request,
        config,
        params: {
          collection: slug1,
        },
      })

      const disableEndpoints = endpointsAreDisabled({
        request,
        endpoints: req.payload.config.endpoints,
      })
      if (disableEndpoints) return disableEndpoints

      collection = req.payload.collections?.[slug1]

      if (collection) {
        const disableEndpoints = endpointsAreDisabled({
          request,
          endpoints: collection.config.endpoints,
        })
        if (disableEndpoints) return disableEndpoints

        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config.endpoints,
        })
        if (customEndpointResponse) return customEndpointResponse

        switch (slug.length) {
          case 1:
            // /:collection
            res = await endpoints.collection.GET.find({ req, collection })
            break
          case 2:
            if (slug2 in endpoints.collection.GET) {
              // /:collection/init
              // /:collection/me
              // /:collection/versions
              res = await (endpoints.collection.GET[slug2] as CollectionRouteHandler)({
                req,
                collection,
              })
            } else {
              // /:collection/:id
              res = await endpoints.collection.GET.findByID({ req, id: slug2, collection })
            }
            break
          case 3:
            if (`doc-${slug2}-by-id` in endpoints.collection.GET) {
              // /:collection/access/:id
              // /:collection/versions/:id
              res = await (
                endpoints.collection.GET[`doc-${slug2}-by-id`] as CollectionRouteHandlerWithID
              )({ req, id: slug3, collection })
            }
            break
        }
      } else if (slug1 === 'globals') {
        const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)

        const disableEndpoints = endpointsAreDisabled({
          request,
          endpoints: globalConfig.endpoints,
        })
        if (disableEndpoints) return disableEndpoints

        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: `${slug1}/${slug2}`,
          payloadRequest: req,
          endpoints: globalConfig.endpoints,
        })
        if (customEndpointResponse) return customEndpointResponse

        switch (slug.length) {
          case 2:
            // /globals/:slug
            res = await endpoints.global.GET.findOne({ req, globalConfig })
            break
          case 3:
            if (`doc-${slug3}` in endpoints.global.GET) {
              // /globals/:slug/access
              // /globals/:slug/versions
              res = await (endpoints.global.GET?.[`doc-${slug3}`] as GlobalRouteHandler)({
                req,
                globalConfig,
              })
            }
            break
          case 4:
            if (`doc-${slug3}-by-id` in endpoints.global.GET) {
              // /globals/:slug/versions/:id
              res = await (
                endpoints.global.GET?.[`doc-${slug3}-by-id`] as GlobalRouteHandlerWithID
              )({
                req,
                id: slug4,
                globalConfig,
              })
            }
            break
        }
      } else if (slug.length === 1 && slug1 === 'access') {
        res = await endpoints.root.GET.access({ req })
      }

      if (res instanceof Response) return res

      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse

      return RouteNotFoundResponse(slug)
    } catch (error) {
      return RouteError({
        req,
        collection,
        err: error,
      })
    }
  }

export const POST =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (request: Request, { params: { slug } }: { params: { slug: string[] } }) => {
    const [slug1, slug2, slug3, slug4] = slug
    let req: PayloadRequest
    let res: Response
    let collection: Collection

    try {
      req = await createPayloadRequest({
        request,
        config,
        params: { collection: slug1 },
      })
      collection = req.payload.collections?.[slug1]

      const disableEndpoints = endpointsAreDisabled({
        request,
        endpoints: req.payload.config.endpoints,
      })
      if (disableEndpoints) return disableEndpoints

      if (collection) {
        const disableEndpoints = endpointsAreDisabled({
          request,
          endpoints: collection.config.endpoints,
        })
        if (disableEndpoints) return disableEndpoints

        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config.endpoints,
        })
        if (customEndpointResponse) return customEndpointResponse

        switch (slug.length) {
          case 1:
            // /:collection
            res = await endpoints.collection.POST.create({ req, collection })
            break
          case 2:
            if (slug2 in endpoints.collection.POST) {
              // /:collection/login
              // /:collection/logout
              // /:collection/unlock
              // /:collection/access
              // /:collection/first-register
              // /:collection/forgot-password
              // /:collection/reset-password
              // /:collection/refresh-token
              res = await (endpoints.collection.POST?.[slug2] as CollectionRouteHandler)({
                req,
                collection,
              })
            }
            break
          case 3:
            if (`doc-${slug2}-by-id` in endpoints.collection.POST) {
              // /:collection/access/:id
              // /:collection/versions/:id
              // /:collection/verify/:token ("doc-verify-by-id" uses id as token internally)
              res = await (
                endpoints.collection.POST[`doc-${slug2}-by-id`] as CollectionRouteHandlerWithID
              )({ req, id: slug3, collection })
            }
            break
        }
      } else if (slug1 === 'globals' && slug2) {
        const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)
        const disableEndpoints = endpointsAreDisabled({
          request,
          endpoints: globalConfig.endpoints,
        })
        if (disableEndpoints) return disableEndpoints

        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: `${slug1}/${slug2}`,
          payloadRequest: req,
          endpoints: globalConfig.endpoints,
        })
        if (customEndpointResponse) return customEndpointResponse

        switch (slug.length) {
          case 2:
            // /globals/:slug
            res = await endpoints.global.POST.update({ req, globalConfig })
            break
          case 3:
            if (`doc-${slug3}` in endpoints.global.POST) {
              // /globals/:slug/access
              res = await (endpoints.global.POST?.[`doc-${slug3}`] as GlobalRouteHandler)({
                req,
                globalConfig,
              })
            }
            break
          case 4:
            if (`doc-${slug3}-by-id` in endpoints.global.POST) {
              // /globals/:slug/versions/:id
              res = await (
                endpoints.global.POST?.[`doc-${slug3}-by-id`] as GlobalRouteHandlerWithID
              )({
                req,
                id: slug4,
                globalConfig,
              })
            }
            break
          default:
            res = new Response('Route Not Found', { status: 404 })
        }
      }

      if (res instanceof Response) return res

      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse

      return RouteNotFoundResponse(slug)
    } catch (error) {
      return RouteError({
        req,
        collection,
        err: error,
      })
    }
  }

export const DELETE =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (request: Request, { params: { slug } }: { params: { slug: string[] } }) => {
    const [slug1, slug2] = slug
    let req: PayloadRequest
    let res: Response
    let collection: Collection

    try {
      req = await createPayloadRequest({
        request,
        config,
        params: {
          collection: slug1,
        },
      })
      collection = req.payload.collections?.[slug1]

      const disableEndpoints = endpointsAreDisabled({
        request,
        endpoints: req.payload.config.endpoints,
      })
      if (disableEndpoints) return disableEndpoints

      if (collection) {
        const disableEndpoints = endpointsAreDisabled({
          request,
          endpoints: collection.config.endpoints,
        })
        if (disableEndpoints) return disableEndpoints

        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config.endpoints,
        })
        if (customEndpointResponse) return customEndpointResponse

        switch (slug.length) {
          case 1:
            // /:collection
            res = await endpoints.collection.DELETE.delete({ req, collection })
            break
          case 2:
            // /:collection/:id
            res = await endpoints.collection.DELETE.deleteByID({ req, id: slug2, collection })
            break
        }
      }

      if (res instanceof Response) return res

      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse

      return RouteNotFoundResponse(slug)
    } catch (error) {
      return RouteError({
        req,
        collection,
        err: error,
      })
    }
  }

export const PATCH =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (request: Request, { params: { slug } }: { params: { slug: string[] } }) => {
    const [slug1, slug2] = slug
    let req: PayloadRequest
    let res: Response
    let collection: Collection

    try {
      req = await createPayloadRequest({
        request,
        config,
        params: {
          collection: slug1,
        },
      })
      collection = req.payload.collections?.[slug1]

      const disableEndpoints = endpointsAreDisabled({
        request,
        endpoints: req.payload.config.endpoints,
      })
      if (disableEndpoints) return disableEndpoints

      if (collection) {
        const disableEndpoints = endpointsAreDisabled({
          request,
          endpoints: collection.config.endpoints,
        })
        if (disableEndpoints) return disableEndpoints

        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config.endpoints,
        })
        if (customEndpointResponse) return customEndpointResponse

        switch (slug.length) {
          case 1:
            // /:collection
            res = await endpoints.collection.PATCH.update({ req, collection })
            break
          case 2:
            // /:collection/:id
            res = await endpoints.collection.PATCH.updateByID({ req, id: slug2, collection })
            break
        }
      }

      if (res instanceof Response) return res

      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse

      return RouteNotFoundResponse(slug)
    } catch (error) {
      return RouteError({
        req,
        collection,
        err: error,
      })
    }
  }
