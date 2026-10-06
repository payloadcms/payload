import type { Data, Document, PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { isolateObjectProperty } from 'payload'
import { getLocaleData } from 'payload/internal'

import type { GenerateLabel, GenerateURL } from '../types.js'

import { formatBreadcrumb } from './formatBreadcrumb.js'
import { getParents as getAllParentDocuments } from './getParents.js'

type Args = {
  breadcrumbsFieldName?: string
  collection: SanitizedCollectionConfig
  data: Data
  generateLabel?: GenerateLabel
  generateURL?: GenerateURL
  originalDoc?: Document
  parentFieldName?: string
  req: PayloadRequest
}
export const populateBreadcrumbs = async ({
  breadcrumbsFieldName = 'breadcrumbs',
  collection,
  data,
  generateLabel,
  generateURL,
  originalDoc,
  parentFieldName,
  req,
}: Args): Promise<Data> => {
  const newData = data
  const { localization } = req.payload.config
  const breadcrumbsField = collection.flattenedFields.find(
    (field) => field.name === breadcrumbsFieldName,
  )

  if (req.locale === 'all' && localization && breadcrumbsField?.localized) {
    let locales = localization.locales
    if (localization.filterAvailableLocales) {
      locales = await localization.filterAvailableLocales({ locales, req })
    }
    const breadcrumbsByLocale = {
      ...(originalDoc?.[breadcrumbsFieldName] || {}),
      ...(data[breadcrumbsFieldName] || {}),
    }
    for (const { code: locale } of locales) {
      const localeReq = isolateObjectProperty(req, 'locale')
      localeReq.locale = locale
      const incomingLocaleData = getLocaleData({
        data,
        fields: collection.fields,
        locale,
        req: localeReq,
      })
      // Locale extraction includes missing schema fields; keep omitted update values out of the merge.
      const localeUpdateData = Object.fromEntries(
        Object.entries(incomingLocaleData).filter(([, value]) => value !== undefined),
      )
      const localeData = await populateBreadcrumbs({
        breadcrumbsFieldName,
        collection,
        data: localeUpdateData,
        generateLabel,
        generateURL,
        originalDoc: originalDoc
          ? getLocaleData({ data: originalDoc, fields: collection.fields, locale, req: localeReq })
          : undefined,
        parentFieldName,
        req: localeReq,
      })
      breadcrumbsByLocale[locale] = localeData[breadcrumbsFieldName]
    }
    newData[breadcrumbsFieldName] = breadcrumbsByLocale
    return newData
  }

  const currentDocument = {
    ...originalDoc,
    ...data,
    id: originalDoc?.id ?? data?.id,
  }

  const allParentDocuments: Document[] = await getAllParentDocuments(
    req,
    {
      generateLabel,
      generateURL,
      parentFieldSlug: parentFieldName,
    },
    collection,
    currentDocument,
  )

  allParentDocuments.push(currentDocument)

  const breadcrumbs = allParentDocuments.map((_, i) =>
    formatBreadcrumb({
      breadcrumb: currentDocument[breadcrumbsFieldName]?.[i],
      collection,
      docs: allParentDocuments.slice(0, i + 1),
      generateLabel,
      generateURL,
      req,
    }),
  )

  newData[breadcrumbsFieldName] = breadcrumbs

  return newData
}
