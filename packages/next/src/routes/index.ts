import config from 'payload-config'
import { createPayloadRequest } from '../utilities/createPayloadRequest'
import { match } from 'path-to-regexp'

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
import { PayloadRequest } from 'payload/types'
import { Endpoint } from 'payload/config'

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
  endpoints: Endpoint[]
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

export const GET = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2, slug3, slug4] = slug

  try {
    const req = await createPayloadRequest({
      request,
      config,
      params: {
        collection: slug1,
      },
    })

    if (req?.collection) {
      const customEndpointResponse = await handleCustomEndpoints({
        entitySlug: slug1,
        payloadRequest: req,
        endpoints: req.collection.config?.endpoints || [],
      })
      if (customEndpointResponse) return customEndpointResponse

      switch (slug.length) {
        case 1:
          // /:collection
          return endpoints.collection.GET.find({ req })
        case 2:
          if (slug2 in endpoints.collection.GET) {
            // /:collection/init
            // /:collection/me
            // /:collection/versions
            return endpoints.collection.GET?.[slug2]({ req })
          }
          // /:collection/:id
          return endpoints.collection.GET.findByID({ req, id: slug2 })
        case 3:
          // /:collection/access/:id
          // /:collection/versions/:id
          const key = `doc-${slug2}-by-id`
          if (key in endpoints.collection.GET) {
            return endpoints.collection.GET[key]({ req, id: slug3 })
          }
          break
        default:
          return new Response('Route Not Found', { status: 404 })
      }
    } else if (slug1 === 'globals') {
      const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)

      if (slug2) {
        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: `${slug1}/${slug2}`,
          payloadRequest: req,
          endpoints: globalConfig?.endpoints || [],
        })
        if (customEndpointResponse) return customEndpointResponse
      }

      switch (slug.length) {
        case 2:
          // /globals/:slug
          return endpoints.global.GET.findOne({ req, globalConfig })
        case 3:
          // /globals/:slug/access
          // /globals/:slug/versions
          return endpoints.global.GET?.[`doc-${slug3}`]({ req, globalConfig })
        case 4:
          // /globals/:slug/versions/:id
          return endpoints.global.GET?.[`doc-${slug3}-by-id`]({ req, id: slug4, globalConfig })
        default:
          return new Response('Route Not Found', { status: 404 })
      }
    } else {
      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse

      if (slug.length === 1 && slug1 === 'access') {
        return endpoints.root.GET.access({ req })
      }

      return new Response('Route Not Found', { status: 404 })
    }
  } catch (error) {
    return new Response(error.message, { status: error?.status || 500 })
  }
}

export const POST = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2, slug3, slug4] = slug

  try {
    const req = await createPayloadRequest({ request, config, params: { collection: slug1 } })

    if (req?.collection) {
      const customEndpointResponse = await handleCustomEndpoints({
        entitySlug: slug1,
        payloadRequest: req,
        endpoints: req.collection.config?.endpoints || [],
      })
      if (customEndpointResponse) return customEndpointResponse

      switch (slug.length) {
        case 1:
          // /:collection
          return endpoints.collection.POST.create({ req })
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
            return endpoints.collection.POST?.[slug2]({ req })
          }
        case 3:
          // /:collection/access/:id
          // /:collection/versions/:id
          // /:collection/verify/:token ("doc-verify-by-id" uses id as token internally)
          return endpoints.collection.POST?.[`doc-${slug2}-by-id`]({ req, id: slug3 })
        default:
          return new Response('Route Not Found', { status: 404 })
      }
    } else if (slug1 === 'globals') {
      const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)

      if (slug2) {
        const customEndpointResponse = await handleCustomEndpoints({
          entitySlug: `${slug1}/${slug2}`,
          payloadRequest: req,
          endpoints: globalConfig?.endpoints || [],
        })
        if (customEndpointResponse) return customEndpointResponse
      }

      switch (slug.length) {
        case 2:
          // /globals/:slug
          return endpoints.global.POST.update({ req, globalConfig })
        case 3:
          // /globals/:slug/access
          return endpoints.global.POST?.[`doc-${slug3}`]({ req, globalConfig })
        case 4:
          // /globals/:slug/versions/:id
          return endpoints.global.POST?.[`doc-${slug3}-by-id`]({ req, id: slug4, globalConfig })
        default:
          return new Response('Route Not Found', { status: 404 })
      }
    } else {
      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse
    }
  } catch (error) {
    return new Response(error.message, { status: error?.status || 500 })
  }
}

export const DELETE = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2] = slug

  try {
    const req = await createPayloadRequest({
      request,
      config,
      params: {
        collection: slug1,
      },
    })

    if (req?.collection) {
      const customEndpointResponse = await handleCustomEndpoints({
        entitySlug: slug1,
        payloadRequest: req,
        endpoints: req.collection.config?.endpoints || [],
      })
      if (customEndpointResponse) return customEndpointResponse

      switch (slug.length) {
        case 1:
          // /:collection
          return endpoints.collection.DELETE.delete({ req })
        case 2:
          // /:collection/:id
          return endpoints.collection.DELETE.deleteByID({ req, id: slug2 })
        default:
          return new Response('Route Not Found', { status: 404 })
      }
    } else {
      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse
    }
  } catch (error) {
    return new Response(error.message, { status: error?.status || 500 })
  }
}

export const PATCH = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2] = slug

  try {
    const req = await createPayloadRequest({
      request,
      config,
      params: {
        collection: slug1,
      },
    })

    if (req?.collection) {
      const customEndpointResponse = await handleCustomEndpoints({
        entitySlug: slug1,
        payloadRequest: req,
        endpoints: req.collection.config?.endpoints || [],
      })
      if (customEndpointResponse) return customEndpointResponse

      switch (slug.length) {
        case 1:
          // /:collection
          return endpoints.collection.PATCH.update({ req })
        case 2:
          // /:collection/:id
          return endpoints.collection.PATCH.updateByID({ req, id: slug2 })
        default:
          return new Response('Route Not Found', { status: 404 })
      }
    } else {
      // root routes
      const customEndpointResponse = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
      if (customEndpointResponse) return customEndpointResponse
    }
  } catch (error) {
    return new Response(error.message, { status: error?.status || 500 })
  }
}
