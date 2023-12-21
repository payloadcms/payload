/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY it because it could be re-written at any time. */
import { login } from '@payloadcms/next/routes/auth/login'
import { me } from '@payloadcms/next/routes/auth/me'
import { refresh } from '@payloadcms/next/routes/auth/refresh'
import { logout } from '@payloadcms/next/routes/auth/logout'
import { unlock } from '@payloadcms/next/routes/auth/unlock'
import { init } from '@payloadcms/next/routes/auth/init'
import { access } from '@payloadcms/next/routes/auth/access'
import { docAccess } from '@payloadcms/next/routes/collections/docAccess'
import { registerFirstUser } from '@payloadcms/next/routes/auth/registerFirstUser'
import { forgotPassword } from '@payloadcms/next/routes/auth/forgotPassword'
import { resetPassword } from '@payloadcms/next/routes/auth/resetPassword'
import { findByID } from '@payloadcms/next/routes/collections/findByID'
import { find } from '@payloadcms/next/routes/collections/find'
import { create as createCollectionDoc } from '@payloadcms/next/routes/collections/create'
import { deleteDoc as deleteCollectionDoc } from '@payloadcms/next/routes/collections/delete'
import { update as updateCollectionDoc } from '@payloadcms/next/routes/collections/update'
import { updateByID as updateCollectionDocByID } from '@payloadcms/next/routes/collections/updateByID'
import { deleteByID } from '@payloadcms/next/routes/collections/deleteByID'
import { findVersions } from '@payloadcms/next/routes/collections/findVersions'
import { restoreVersion } from '@payloadcms/next/routes/collections/restoreVersion'
import { findVersionByID } from '@payloadcms/next/routes/collections/findVersionByID'
import { verifyEmail } from '@payloadcms/next/routes/auth/verifyEmail'
import { docAccess as docAccessGlobal } from '@payloadcms/next/routes/globals/docAccess'
import { findOne } from '@payloadcms/next/routes/globals/findOne'
import { findVersionByID as findVersionByIdGlobal } from '@payloadcms/next/routes/globals/findVersionByID'
import { findVersions as findVersionsGlobal } from '@payloadcms/next/routes/globals/findVersions'
import { restoreVersion as restoreVersionGlobal } from '@payloadcms/next/routes/globals/restoreVersion'
import { update as updateGlobal } from '@payloadcms/next/routes/globals/update'
import { createPayloadRequest } from '@payloadcms/next/utilities/createPayloadRequest'
import config from 'payload-config'

const endpoints = {
  collection: {
    GET: {
      init,
      me,
      find,
      findByID,
      versions: findVersions,
      'doc-versions-by-id': findVersionByID,
      'doc-access-by-id': docAccess,
    },
    POST: {
      unlock,
      login,
      'first-register': registerFirstUser,
      'forgot-password': forgotPassword,
      'reset-password': resetPassword,
      logout,
      'refresh-token': refresh,
      create: createCollectionDoc,
      access,
      'doc-access-by-id': docAccess,
      'doc-versions-by-id': restoreVersion,
      'doc-verify-by-id': verifyEmail,
    },
    PATCH: {
      update: updateCollectionDoc,
      updateByID: updateCollectionDocByID,
    },
    DELETE: {
      delete: deleteCollectionDoc,
      deleteByID,
    },
  },
  global: {
    GET: {
      findOne,
      findVersionByID: findVersionByIdGlobal,
      'doc-versions': findVersionsGlobal,
      'doc-access': docAccessGlobal,
    },
    POST: {
      docAccess: docAccessGlobal,
      restoreVersion: restoreVersionGlobal,
      update: updateGlobal,
    },
  },
}

export const GET = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2, slug3, slug4] = slug

  const req = await createPayloadRequest({
    request,
    config,
    params: {
      collection: slug1,
    },
  })

  if (req?.collection) {
    switch (slug.length) {
      case 1:
        // /:collection
        return endpoints.collection.GET.find({ req })
      case 2:
        if (slug2 in endpoints.collection.GET) {
          // i.e. /:collection/me or /:collection/init
          return endpoints.collection.GET[slug2]({ req })
        } else {
          // /:collection/:id
          return endpoints.collection.GET.findByID({ req, id: slug2 })
        }
      case 3:
        // /:collection/access/:id
        // /:collection/versions/:id
        const key = `doc-${slug2}-by-id`
        return endpoints.collection.GET[key]({ req, id: slug3 })
      default:
        return new Response('Not Found', { status: 404 })
    }
  } else if (slug1 === 'globals') {
    const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)

    switch (slug.length) {
      case 2:
        // /globals/:slug
        return endpoints.global.GET.findOne({ req, globalConfig })
      case 3:
        // /globals/:slug/access
        // /globals/:slug/versions
        const key = `doc-${slug3}`
        return endpoints.global.GET[key]({ req, globalConfig })
      case 4:
        if (slug3 === 'versions') {
          // /globals/:slug/versions/:id
          return endpoints.global.GET.findVersionByID({ req, id: slug4, globalConfig })
        }
        break
      default:
        return new Response('Not Found', { status: 404 })
    }
  }
}

export const POST = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2, slug3, slug4] = slug

  const req = await createPayloadRequest({ request, config, params: { collection: slug1 } })

  if (req?.collection) {
    switch (slug.length) {
      case 1:
        // /:collection
        return endpoints.collection.POST.create({ req })
      case 2:
        if (slug2 in endpoints.collection.POST) {
          return endpoints.collection.POST[slug2]({ req })
        }
      case 3:
        // /:collection/access/:id
        // /:collection/versions/:id
        // /:collection/verify/:token ("doc-verify-by-id" uses id as token internally)
        const key = `doc-${slug2}-by-id`
        return endpoints.collection.POST[key]({ req, id: slug3 })
      default:
        return new Response('Not Found', { status: 404 })
    }
  } else if (slug1 === 'globals') {
    const globalConfig = req.payload.config.globals.find((global) => global.slug === slug2)
    switch (slug.length) {
      case 2:
        // /globals/:slug
        return endpoints.global.POST.update({ req, globalConfig })
      case 3:
        return endpoints.global.POST.docAccess({ req, globalConfig })
      case 4:
        return endpoints.global.POST.restoreVersion({ req, id: slug4, globalConfig })
      default:
        return new Response('Not Found', { status: 404 })
    }
  }
}

export const DELETE = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2] = slug

  const req = await createPayloadRequest({
    request,
    config,
    params: {
      collection: slug1,
    },
  })

  if (req?.collection) {
    switch (slug.length) {
      case 1:
        // /:collection
        return endpoints.collection.DELETE.delete({ req })
      case 2:
        // /:collection/access/:id
        return endpoints.collection.DELETE.deleteByID({ req, id: slug2 })
      default:
        return new Response('Not Found', { status: 404 })
    }
  }
}

export const PATCH = async (
  request: Request,
  { params: { slug } }: { params: { slug: string[] } },
) => {
  const [slug1, slug2] = slug

  const req = await createPayloadRequest({
    request,
    config,
    params: {
      collection: slug1,
    },
  })

  if (req?.collection) {
    switch (slug.length) {
      case 1:
        // /:collection
        return endpoints.collection.PATCH.update({ req })
      case 2:
        // /:collection/:id
        return endpoints.collection.PATCH.updateByID({ req, id: slug2 })
      default:
        return new Response('Not Found', { status: 404 })
    }
  }
}
