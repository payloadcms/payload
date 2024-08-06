import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteMatch } from 'react-router-dom'

import type { FieldPermissions } from '../../../../auth'
import type { Field, FieldAffectingData } from '../../../../fields/config/types'
import type { Option } from '../../elements/ReactSelect/types'
import type { StepNavItem } from '../../elements/StepNav/types'
import type { CompareOption, Props } from './types'

import { fieldAffectsData } from '../../../../fields/config/types'
import { getTranslation } from '../../../../utilities/getTranslation'
import usePayloadAPI from '../../../hooks/usePayloadAPI'
import { formatDate } from '../../../utilities/formatDate'
import { Gutter } from '../../elements/Gutter'
import { useStepNav } from '../../elements/StepNav'
import { useActions } from '../../utilities/ActionsProvider'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import Meta from '../../utilities/Meta'
import NotFound from '../NotFound'
import CompareVersion from './Compare'
import RenderFieldsToDiff from './RenderFieldsToDiff'
import fieldComponents from './RenderFieldsToDiff/fields'
import Restore from './Restore'
import SelectLocales from './SelectLocales'
import './index.scss'

const baseClass = 'view-version'

const VersionView: React.FC<Props> = ({ collection, global }) => {
  const {
    admin: { dateFormat },
    localization,
    routes: { admin, api },
    serverURL,
  } = useConfig()
  const { setStepNav } = useStepNav()

  const { setViewActions } = useActions()

  const {
    params: { id, versionID },
  } = useRouteMatch<{ id?: string; versionID: string }>()

  const [compareValue, setCompareValue] = useState<CompareOption>()
  const [localeOptions] = useState<Option[]>(() => {
    if (localization && localization?.locales) {
      return localization.locales.map(({ code, label }) => ({
        label,
        value: code,
      }))
    }
    return []
  })
  const [locales, setLocales] = useState<Option[]>(localeOptions)
  const { permissions } = useAuth()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation('version')
  const { docPermissions } = useDocumentInfo()

  let originalDocFetchURL: string
  let versionFetchURL: string
  let entityLabel: string
  let fields: Field[]
  let fieldPermissions: Record<string, FieldPermissions>
  let compareBaseURL: string
  let slug: string
  let parentID: string
  const [latestDraftVersion, setLatestDraftVersion] = useState(undefined)
  const [latestPublishedVersion, setLatestPublishedVersion] = useState(undefined)

  if (collection) {
    ;({ slug } = collection)
    originalDocFetchURL = `${serverURL}${api}/${slug}/${id}`
    versionFetchURL = `${serverURL}${api}/${slug}/versions/${versionID}`
    compareBaseURL = `${serverURL}${api}/${slug}/versions`
    entityLabel = getTranslation(collection.labels.singular, i18n)
    parentID = id
    fields = collection.fields
    fieldPermissions = permissions.collections[collection.slug].fields
  }

  if (global) {
    ;({ slug } = global)
    originalDocFetchURL = `${serverURL}${api}/globals/${slug}`
    versionFetchURL = `${serverURL}${api}/globals/${slug}/versions/${versionID}`
    compareBaseURL = `${serverURL}${api}/globals/${slug}/versions`
    entityLabel = getTranslation(global.label, i18n)
    fields = global.fields
    fieldPermissions = permissions.globals[global.slug].fields
  }

  const compareFetchURL = compareValue?.value && `${compareBaseURL}/${compareValue.value}`

  const [{ data: doc, isError }] = usePayloadAPI(versionFetchURL, {
    initialParams: { depth: 1, locale: '*' },
  })
  const [{ data: publishedDoc }] = usePayloadAPI(originalDocFetchURL, {
    initialParams: { depth: 1, locale: '*' },
  })
  const [{ data: mostRecentDoc }] = usePayloadAPI(originalDocFetchURL, {
    initialParams: { depth: 1, draft: true, locale: '*' },
  })
  const [{ data: compareDoc }] = usePayloadAPI(compareFetchURL, {
    initialParams: { depth: 1, draft: 'true', locale: '*' },
  })

  const hasDraftsEnabled = collection?.versions?.drafts || global?.versions?.drafts

  const sharedParams = (status) => {
    return {
      depth: 0,
      limit: 1,
      sort: '-updatedAt',
      where: {
        'version._status': {
          equals: status,
        },
      },
    }
  }

  const [{ data: draft }] = usePayloadAPI(compareBaseURL, {
    initialParams: hasDraftsEnabled ? { ...sharedParams('draft') } : {},
  })

  const [{ data: published }] = usePayloadAPI(compareBaseURL, {
    initialParams: hasDraftsEnabled ? { ...sharedParams('published') } : {},
  })

  useEffect(() => {
    if (hasDraftsEnabled) {
      const formattedPublished = published?.docs?.length > 0 && published?.docs[0]
      const formattedDraft = draft?.docs?.length > 0 && draft?.docs[0]

      if (!formattedPublished || !formattedDraft) return

      const publishedNewerThanDraft = formattedPublished?.updatedAt > formattedDraft?.updatedAt

      setLatestDraftVersion(publishedNewerThanDraft ? undefined : formattedDraft?.id)
      setLatestPublishedVersion(formattedPublished.latest ? formattedPublished?.id : undefined)
    }
  }, [hasDraftsEnabled, draft, published])

  useEffect(() => {
    let nav: StepNavItem[] = []

    if (collection) {
      let docLabel = ''

      if (mostRecentDoc) {
        const { useAsTitle } = collection.admin

        if (useAsTitle !== 'id') {
          const titleField = collection.fields.find(
            (field) => fieldAffectsData(field) && field.name === useAsTitle,
          ) as FieldAffectingData

          if (titleField && mostRecentDoc[useAsTitle]) {
            if (titleField.localized) {
              docLabel = mostRecentDoc[useAsTitle]?.[locale]
            } else {
              docLabel = mostRecentDoc[useAsTitle]
            }
          } else {
            docLabel = `[${t('general:untitled')}]`
          }
        } else {
          docLabel = mostRecentDoc.id
        }
      }

      nav = [
        {
          label: getTranslation(collection.labels.plural, i18n),
          url: `${admin}/collections/${collection.slug}`,
        },
        {
          label: docLabel,
          url: `${admin}/collections/${collection.slug}/${id}`,
        },
        {
          label: 'Versions',
          url: `${admin}/collections/${collection.slug}/${id}/versions`,
        },
        {
          label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
        },
      ]
    }

    if (global) {
      nav = [
        {
          label: global.label,
          url: `${admin}/globals/${global.slug}`,
        },
        {
          label: 'Versions',
          url: `${admin}/globals/${global.slug}/versions`,
        },
        {
          label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
        },
      ]
    }

    setStepNav(nav)
  }, [setStepNav, collection, global, dateFormat, doc, mostRecentDoc, admin, id, locale, t, i18n])

  useEffect(() => {
    const editConfig = (collection || global)?.admin?.components?.views?.Edit
    const versionActions =
      editConfig && 'Version' in editConfig && 'actions' in editConfig.Version
        ? editConfig.Version.actions
        : []

    setViewActions(versionActions)

    return () => {
      setViewActions([])
    }
  }, [collection, global, setViewActions])

  let metaTitle: string
  let metaDesc: string
  const versionCreatedAt = doc?.updatedAt
    ? formatDate(doc.updatedAt, dateFormat, i18n?.language)
    : ''

  if (collection) {
    const useAsTitle = collection?.admin?.useAsTitle || 'id'
    metaTitle = `${t('version')} - ${versionCreatedAt} - ${doc[useAsTitle]} - ${entityLabel}`
    metaDesc = t('viewingVersion', { documentTitle: doc[useAsTitle], entityLabel })
  }

  if (global) {
    metaTitle = `${t('version')} - ${versionCreatedAt} - ${entityLabel}`
    metaDesc = t('viewingVersionGlobal', { entityLabel })
  }

  let comparison = compareDoc?.version

  if (compareValue?.value === 'mostRecent') {
    comparison = mostRecentDoc
  }

  if (compareValue?.value === 'published') {
    comparison = publishedDoc
  }

  const canUpdate = docPermissions?.update?.permission

  if (isError) {
    return <NotFound marginTop="large" />
  }

  return (
    <main className={baseClass}>
      <Meta description={metaDesc} title={metaTitle} />
      <Gutter className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__header-wrap`}>
          <p className={`${baseClass}__created-at`}>
            {t('versionCreatedOn', {
              version: t(doc?.autosave ? 'autosavedVersion' : 'version'),
            })}
          </p>
          <header className={`${baseClass}__header`}>
            <h2>{versionCreatedAt}</h2>
            {canUpdate && (
              <Restore
                className={`${baseClass}__restore`}
                collection={collection}
                global={global}
                originalDocID={id}
                versionDate={versionCreatedAt}
                versionID={versionID}
              />
            )}
          </header>
        </div>
        <div className={`${baseClass}__controls`}>
          <CompareVersion
            baseURL={compareBaseURL}
            latestDraftVersion={latestDraftVersion}
            latestPublishedVersion={latestPublishedVersion}
            onChange={setCompareValue}
            parentID={parentID}
            value={compareValue}
            versionID={versionID}
          />
          {localization && (
            <SelectLocales onChange={setLocales} options={localeOptions} value={locales} />
          )}
        </div>

        {doc?.version && (
          <RenderFieldsToDiff
            comparison={comparison}
            fieldComponents={fieldComponents}
            fieldPermissions={fieldPermissions}
            fields={fields}
            locales={
              locales
                ? locales.map(({ label }) => (typeof label === 'string' ? label : undefined))
                : []
            }
            version={doc?.version}
          />
        )}
      </Gutter>
    </main>
  )
}

export default VersionView
