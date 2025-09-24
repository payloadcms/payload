// @ts-strict-ignore
import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'

type Args = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  payload: Payload
  req?: PayloadRequest
}

export const unpublish = async ({
  id,
  collection,
  global,
  payload,
  req,
}: Args): Promise<null | TypeWithID> => {
  const now = new Date().toISOString()
  const findVersionArgs = {
    limit: 2,
    pagination: false,
    req,
    sort: '-updatedAt',
  }
  const locale = req?.query.locale as string
  const unpublishSpecificLocale = req?.query.unpublishSpecificLocale ? locale : undefined

  try {
    let docs: any[] = []
    const whereQuery =
      unpublishSpecificLocale && typeof unpublishSpecificLocale === 'string'
        ? {
            [`localeStatus.${unpublishSpecificLocale}`]: { equals: 'published' },
          }
        : { 'version._status': { equals: 'published' } }

    if (collection) {
      ;({ docs } = await payload.db.findVersions({
        ...findVersionArgs,
        collection: collection.slug,
        where: {
          and: [{ parent: { equals: id } }, whereQuery],
        },
      }))
    }

    if (global) {
      ;({ docs } = await payload.db.findGlobalVersions({
        ...findVersionArgs,
        global: global.slug,
        where: whereQuery,
      }))
    }

    const latestVersion = docs[0]
    const previousPublish = docs[1]
    if (!latestVersion) {
      return null
    }

    const data: Record<string, unknown> = {
      ...latestVersion,
      createdAt: now,
      parent: id,
      updatedAt: now,
      version: {
        ...latestVersion.version,
        _status: 'draft',
        updatedAt: now,
      },
    }

    if (unpublishSpecificLocale) {
      data.localeStatus = {
        ...latestVersion.localeStatus,
        [unpublishSpecificLocale]: 'draft',
      }
    } else {
      data.localeStatus = Object.fromEntries(
        Object.keys(data.localeStatus as Record<string, unknown>).map((locale) => [
          locale,
          'draft',
        ]),
      )
    }

    const updateVersionArgs = {
      id: latestVersion.id,
      req,
      versionData: data as TypeWithID,
    }

    let result
    const updateData = previousPublish ? previousPublish.version : { _status: 'draft' }
    if (collection && id !== undefined) {
      // update main doc to previous published if available
      // otherwise set to draft
      await payload.db.updateOne({
        collection: collection.slug,
        data: updateData,
        locale: locale || undefined,
        req,
        where: { id: { equals: id } },
      })

      // update version to draft
      await payload.db.updateVersion({
        ...updateVersionArgs,
        collection: collection.slug,
      })

      // fetch updated main doc in requested locale
      result = await payload.findByID({
        id,
        collection: collection.slug,
        draft: true,
        locale,
        req,
      })
    }

    if (global) {
      // update main doc to previous published if available
      // otherwise set to draft
      await payload.db.updateGlobal({
        slug: global.slug,
        data: updateData,
        req,
      })

      // update version to draft
      await payload.db.updateGlobalVersion({
        ...updateVersionArgs,
        global: global.slug,
      })

      // fetch updated main doc in requested locale
      result = await payload.findGlobal({
        slug: global.slug,
        draft: true,
        locale,
        req,
      })
    }

    return result as TypeWithID
  } catch (err) {
    let errorMessage: string

    if (collection) {
      errorMessage = `There was an error while unpublishing the ${
        typeof collection.labels.singular === 'string'
          ? collection.labels.singular
          : collection.slug
      } with ID ${id}.`
    } else if (global) {
      errorMessage = `There was an error while unpublishing the global ${
        typeof global.label === 'string' ? global.label : global.slug
      }.`
    } else {
      errorMessage = `There was an error while unpublishing.`
    }

    payload.logger.error({ err, msg: errorMessage })
    return null
  }
}
