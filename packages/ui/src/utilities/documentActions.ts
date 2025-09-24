import { toast } from 'sonner'

import { requests } from './api.js'

type CommonArgs = {
  baseUrl: string
  i18nLanguage: string
  locale: string
  resetForm: any
  setMostRecentVersionIsAutosaved: (value: boolean) => void
  t: (key: string, options?: any) => string
}

type UnpublishArgs = {
  setStatusToRender?: (status: 'changed' | 'draft' | 'published') => void
  unpublishSpecificLocale?: boolean
} & CommonArgs

type RevertArgs = {
  collectionSlug?: string
  globalSlug?: string
  incrementVersionCount: () => void
  setHasPublishedDoc: (value: boolean) => void
  setUnpublishedVersionCount: (count: number) => void
} & CommonArgs

export async function unpublishDocument({
  baseUrl,
  i18nLanguage,
  locale,
  resetForm,
  setMostRecentVersionIsAutosaved,
  setStatusToRender,
  t,
  unpublishSpecificLocale = false,
}: UnpublishArgs) {
  const headers = {
    'Accept-Language': i18nLanguage,
    'Content-Type': 'application/json',
  }

  const url =
    `${baseUrl}/unpublish` +
    (locale ? `?locale=${locale}` : '') +
    (unpublishSpecificLocale ? `&unpublishSpecificLocale=true` : '')

  const res = await requests.post(url, { headers })

  if (res.status === 200) {
    const json = await res.json()
    const data = json.result

    resetForm(data)
    toast.success(json.message)
    setMostRecentVersionIsAutosaved(false)
    if (setStatusToRender) {
      setStatusToRender('draft')
    }
  } else {
    try {
      const json = await res.json()
      if (json.errors?.[0]?.message) {
        toast.error(json.errors[0].message)
      } else if (json.error) {
        toast.error(json.error)
      } else {
        toast.error(t('error:unPublishingDocument'))
      }
    } catch {
      toast.error(t('error:unPublishingDocument'))
    }
  }
}

export async function revertDocument({
  baseUrl,
  collectionSlug,
  globalSlug,
  i18nLanguage,
  incrementVersionCount,
  locale,
  resetForm,
  setHasPublishedDoc,
  setMostRecentVersionIsAutosaved,
  setUnpublishedVersionCount,
  t,
}: RevertArgs) {
  const headers = {
    'Accept-Language': i18nLanguage,
    'Content-Type': 'application/json',
  }

  const publishedDocURL = `${baseUrl}?locale=${locale}&fallback-locale=null&depth=0`
  const url = `${baseUrl}?publishSpecificLocale=${locale}`
  const method: 'patch' | 'post' = collectionSlug ? 'patch' : 'post'

  const publishedDoc = await requests.get(publishedDocURL, { headers }).then((r) => r.json())

  const body = publishedDoc._status === 'published' ? publishedDoc : undefined
  if (!body) {
    toast.error(t('version:revertUnsuccessful'))
    return
  }

  const res = await requests[method](url, {
    body: JSON.stringify(body),
    headers,
  })

  if (res.status === 200) {
    const json = await res.json()
    const data = !globalSlug ? json.doc : json.result

    resetForm(data)
    toast.success(json.message)
    setMostRecentVersionIsAutosaved(false)
    setHasPublishedDoc(true)
    incrementVersionCount()
    setUnpublishedVersionCount(0)
  } else {
    try {
      const json = await res.json()
      if (json.errors?.[0]?.message) {
        toast.error(json.errors[0].message)
      } else if (json.error) {
        toast.error(json.error)
      } else {
        toast.error(t('error:unPublishingDocument'))
      }
    } catch {
      toast.error(t('error:unPublishingDocument'))
    }
  }
}
