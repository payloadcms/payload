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
    const collection = req.payload?.collections?.[slug1]

    let response: Response | Promise<Response> = null

    if (collection) {
      if (slug.length === 1) {
        // /:collection
        response = endpoints.collection.GET.find({ req, collection })
      } else if (slug.length === 2 && slug2 in endpoints.collection.GET) {
        // /:collection/init
        // /:collection/me
        // /:collection/versions
        response = endpoints.collection.GET?.[slug2]({ req, collection })
      } else if (slug.length === 3 && `doc-${slug2}-by-id` in endpoints.collection.GET) {
        // /:collection/access/:id
        // /:collection/versions/:id
        response = endpoints.collection.GET[`doc-${slug2}-by-id`]({ req, id: slug3, collection })
      } else {
        response = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config?.endpoints || [],
        })
      }
    } else if (slug1 === 'globals') {
      const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)

      if (slug.length === 2) {
        // /globals/:slug
        response = endpoints.global.GET.findOne({ req, globalConfig })
      } else if (slug.length === 3 && `doc-${slug3}` in endpoints.global.GET) {
        // /globals/:slug/access
        // /globals/:slug/versions
        response = endpoints.global.GET[`doc-${slug3}`]({ req, globalConfig })
      } else if (slug.length === 4 && `doc-${slug3}-by-id` in endpoints.global.GET) {
        // /globals/:slug/versions/:id
        response = endpoints.global.GET[`doc-${slug3}-by-id`]({ req, id: slug4, globalConfig })
      } else if (slug2) {
        response = await handleCustomEndpoints({
          entitySlug: `${slug1}/${slug2}`,
          payloadRequest: req,
          endpoints: globalConfig?.endpoints || [],
        })
      }
    } else if (slug.length === 1 && slug1 === 'access') {
      response = endpoints.root.GET.access({ req })
    } else {
      // root routes
      response = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
    }

    return response || new Response(`Route Not Found: "${slug.join('/')}"`, { status: 404 })
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
    const collection = req.payload?.collections?.[slug1]

    let response: Response | Promise<Response> = null

    if (collection) {
      if (slug.length === 1) {
        // /:collection
        response = endpoints.collection.POST.create({ req, collection })
      } else if (slug.length === 2 && slug2 in endpoints.collection.POST) {
        // /:collection/login
        // /:collection/logout
        // /:collection/unlock
        // /:collection/access
        // /:collection/first-register
        // /:collection/forgot-password
        // /:collection/reset-password
        // /:collection/refresh-token
        response = await endpoints.collection.POST[slug2]({ req, collection })
      } else if (slug.length === 3 && `doc-${slug2}-by-id` in endpoints.collection.POST) {
        // /:collection/access/:id
        // /:collection/versions/:id
        // /:collection/verify/:token ("doc-verify-by-id" uses id as token internally)
        response = endpoints.collection.POST[`doc-${slug2}-by-id`]({ req, collection, id: slug3 })
      } else {
        response = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config?.endpoints || [],
        })
      }
    } else if (slug1 === 'globals') {
      const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)

      if (slug.length === 2) {
        // /globals/:slug
        response = endpoints.global.POST.update({ req, globalConfig })
      } else if (slug.length === 3 && `doc-${slug3}` in endpoints.global.POST) {
        // /globals/:slug/access
        response = endpoints.global.POST[`doc-${slug3}`]({ req, globalConfig })
      } else if (slug.length === 4 && `doc-${slug3}-by-id` in endpoints.global.POST) {
        // /globals/:slug/versions/:id
        response = endpoints.global.POST[`doc-${slug3}-by-id`]({
          req,
          id: slug4,
          globalConfig,
        })
      } else if (slug2) {
        response = await handleCustomEndpoints({
          entitySlug: `${slug1}/${slug2}`,
          payloadRequest: req,
          endpoints: globalConfig?.endpoints || [],
        })
      }
    } else {
      // root routes
      response = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
    }

    return response || new Response(`Route Not Found: "${slug.join('/')}"`, { status: 404 })
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
    const collection = req.payload?.collections?.[slug1]

    let response: Response | Promise<Response> = null

    if (collection) {
      if (slug.length === 1) {
        // /:collection
        response = endpoints.collection.DELETE.delete({ req, collection })
      } else if (slug.length === 2) {
        // /:collection/:id
        response = endpoints.collection.DELETE.deleteByID({ req, id: slug2, collection })
      } else {
        response = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config?.endpoints || [],
        })
      }
    } else {
      // root routes
      response = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
    }

    return response || new Response(`Route Not Found: "${slug.join('/')}"`, { status: 404 })
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
    const collection = req.payload?.collections?.[slug1]

    let response: Response | Promise<Response> = null

    if (collection) {
      if (slug.length === 1) {
        // /:collection
        response = endpoints.collection.PATCH.update({ req, collection })
      } else if (slug.length === 2) {
        // /:collection/:id
        response = endpoints.collection.PATCH.updateByID({ req, id: slug2, collection })
      } else {
        response = await handleCustomEndpoints({
          entitySlug: slug1,
          payloadRequest: req,
          endpoints: collection.config?.endpoints || [],
        })
      }
    } else {
      // root routes
      response = await handleCustomEndpoints({
        payloadRequest: req,
        endpoints: req.payload.config.endpoints,
      })
    }

    return response || new Response(`Route Not Found: "${slug.join('/')}"`, { status: 404 })
  } catch (error) {
    return new Response(error.message, { status: error?.status || 500 })
  }
}
