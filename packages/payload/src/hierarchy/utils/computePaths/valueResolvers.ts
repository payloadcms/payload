import type { Document, PayloadRequest } from '../../../types/index.js'
import type { ComputePathsResult } from './types.js'

import { buildLocalizedHierarchyPaths } from '../buildLocalizedHierarchyPaths.js'
import { getLocalizedValue } from '../getLocalizedValue.js'

export const toLocalizedPathMap = ({
  locales,
  value,
}: {
  locales: string[]
  value: Record<string, string> | string | undefined
}): Record<string, string> | undefined => {
  if (!value) {
    return undefined
  }

  if (typeof value === 'object') {
    return value
  }

  const mappedValue: Record<string, string> = {}
  for (const locale of locales) {
    mappedValue[locale] = value
  }

  return mappedValue
}

export const getTitleValue = ({
  document,
  isTitleLocalized = false,
  locale,
  req,
  titleFieldName,
}: {
  document: Document
  isTitleLocalized?: boolean
  locale?: string
  req: PayloadRequest
  titleFieldName: string
}): Record<string, string> | string => {
  const titleValue = document[titleFieldName]

  if (!titleValue) {
    return document.id?.toString() || 'untitled'
  }

  if (isTitleLocalized && locale === 'all') {
    if (typeof titleValue === 'object') {
      return titleValue
    }

    if (typeof titleValue === 'string') {
      const defaultLocale = req.payload.config.localization
        ? req.payload.config.localization.defaultLocale
        : undefined
      if (defaultLocale) {
        return { [defaultLocale]: titleValue }
      }
    }
  }

  if (isTitleLocalized && typeof titleValue === 'object') {
    const resolvedLocale =
      locale ||
      req.locale ||
      (req.payload.config.localization ? req.payload.config.localization.defaultLocale : undefined)

    const localizedValue = getLocalizedValue({
      fallbackLocale: req.fallbackLocale,
      fieldType: 'text',
      locale: resolvedLocale as string,
      value: titleValue,
    })
    return localizedValue || document.id?.toString() || 'untitled'
  }

  return titleValue
}

export const getSlugFieldValue = ({
  document,
  isSlugLocalized = false,
  locale,
  req,
  slugFieldName,
}: {
  document: Document
  isSlugLocalized?: boolean
  locale?: string
  req: PayloadRequest
  slugFieldName: string
}): Record<string, string> | string | undefined => {
  const slugValue = document[slugFieldName]

  if (!slugValue) {
    return undefined
  }

  if (isSlugLocalized && locale === 'all') {
    if (typeof slugValue === 'object') {
      return slugValue
    }

    if (typeof slugValue === 'string') {
      const defaultLocale = req.payload.config.localization
        ? req.payload.config.localization.defaultLocale
        : undefined
      if (defaultLocale) {
        return { [defaultLocale]: slugValue }
      }
    }
  }

  if (isSlugLocalized && typeof slugValue === 'object') {
    const resolvedLocale =
      locale ||
      req.locale ||
      (req.payload.config.localization ? req.payload.config.localization.defaultLocale : undefined)

    if (!resolvedLocale || resolvedLocale === 'all') {
      return undefined
    }

    const localizedValue = getLocalizedValue({
      fallbackLocale: req.fallbackLocale,
      fieldType: 'text',
      locale: resolvedLocale,
      value: slugValue,
    })
    return localizedValue || undefined
  }

  return slugValue
}

export const buildBasePathsForDocument = ({
  document,
  isSlugLocalized,
  isTitleLocalized,
  locale,
  req,
  slugFieldName,
  slugify,
  titleFieldName,
  titlePathSeparator,
}: {
  document: Document
  isSlugLocalized: boolean
  isTitleLocalized: boolean
  locale?: string
  req: PayloadRequest
  slugFieldName?: string
  slugify: (val: string) => string
  titleFieldName: string
  titlePathSeparator: string
}): ComputePathsResult => {
  const titleValue = getTitleValue({
    document,
    isTitleLocalized,
    locale,
    req,
    titleFieldName,
  })

  const slugValue = slugFieldName
    ? getSlugFieldValue({
        document,
        isSlugLocalized,
        locale,
        req,
        slugFieldName,
      })
    : undefined

  if ((isSlugLocalized || isTitleLocalized) && locale === 'all') {
    const locales = req.payload.config.localization
      ? req.payload.config.localization.localeCodes
      : []

    return buildLocalizedHierarchyPaths({
      req,
      slugify,
      slugValue: slugValue as Record<string, string> | undefined,
      titlePathSeparator,
      titleValue: isTitleLocalized
        ? (titleValue as Record<string, string>)
        : (toLocalizedPathMap({ locales, value: titleValue as string }) ?? {}),
    })
  }

  return {
    slugPath: slugValue !== undefined ? (slugValue as string) : slugify(titleValue as string),
    titlePath: titleValue as string,
  }
}
