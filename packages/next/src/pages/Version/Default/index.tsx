import React from 'react'
import type { FieldAffectingData } from 'payload/types'
import type { StepNavItem } from '@payloadcms/ui'
import type { DefaultVersionsViewProps } from './types'
import { fieldAffectsData } from 'payload/types'
import { Gutter, SetStepNav } from '@payloadcms/ui'
import RenderFieldsToDiff from '../RenderFieldsToDiff'
import fieldComponents from '../RenderFieldsToDiff/fields'
import Restore from '../Restore'
import './index.scss'
import { mostRecentVersionOption } from '../shared'
import { getTranslation } from '@payloadcms/translations'

const baseClass = 'view-version'

export const DefaultVersionView: React.FC<DefaultVersionsViewProps> = ({
  doc,
  mostRecentDoc,
  publishedDoc,
  compareDoc,
  locales,
  docPermissions,
  fields,
  config,
  collectionConfig,
  globalConfig,
  id,
  versionID,
  locale,
  i18n,
}) => {
  const {
    routes: { admin },
  } = config

  let nav: StepNavItem[] = []

  if (collectionConfig) {
    let docLabel = ''

    if (mostRecentDoc) {
      const { useAsTitle } = collectionConfig.admin

      if (useAsTitle !== 'id') {
        const titleField = collectionConfig.fields.find(
          (field) => fieldAffectsData(field) && field.name === useAsTitle,
        ) as FieldAffectingData

        if (titleField && mostRecentDoc[useAsTitle]) {
          if (titleField.localized) {
            docLabel = mostRecentDoc[useAsTitle]?.[locale]
          } else {
            docLabel = mostRecentDoc[useAsTitle]
          }
        } else {
          docLabel = `[${i18n.t('general:untitled')}]`
        }
      } else {
        docLabel = mostRecentDoc.id
      }
    }

    nav = [
      {
        label: getTranslation(collectionConfig.labels.plural, i18n),
        url: `${admin}/collections/${collectionConfig.slug}`,
      },
      {
        label: docLabel,
        url: `${admin}/collections/${collectionConfig.slug}/${id}`,
      },
      {
        label: 'Versions',
        url: `${admin}/collections/${collectionConfig.slug}/${id}/versions`,
      },
      {
        label: '[Date]', // TODO: fix this (see below)
        // label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
      },
    ]
  }

  if (globalConfig) {
    nav = [
      {
        label: globalConfig.label,
        url: `${admin}/globals/${globalConfig.slug}`,
      },
      {
        // TODO(i18n)
        label: 'Versions',
        url: `${admin}/globals/${globalConfig.slug}/versions`,
      },
      {
        // TODO(i18n)
        label: '[Date]',
        // label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
      },
    ]
  }

  // useEffect(() => {
  //   const editConfig = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit
  //   const versionActions =
  //     editConfig && 'Version' in editConfig && 'actions' in editConfig.Version
  //       ? editConfig.Version.actions
  //       : []

  //   setViewActions(versionActions)
  // }, [collectionConfig, globalConfig, setViewActions])

  const formattedCreatedAt = doc?.createdAt
  // const formattedCreatedAt = doc?.createdAt
  // TODO(i18n)
  //   ? formatDate(doc.createdAt, dateFormat, i18n?.language)
  //   : ''

  // TODO: this value should ultimately be dynamic based on the user's selection
  // This will come from URL params
  let compareValue = mostRecentVersionOption

  let comparison = compareDoc?.version

  if (compareValue?.value === 'mostRecent') {
    comparison = mostRecentDoc
  }

  if (compareValue?.value === 'published') {
    comparison = publishedDoc
  }

  const canUpdate = docPermissions?.update?.permission

  return (
    <main className={baseClass}>
      <SetStepNav nav={nav} />
      <Gutter className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__header-wrap`}>
          <p className={`${baseClass}__created-at`}>
            {i18n.t('versionCreatedOn', {
              version: i18n.t(doc?.autosave ? 'autosavedVersion' : 'version'),
            })}
          </p>
          <header className={`${baseClass}__header`}>
            <h2>{formattedCreatedAt}</h2>
            {canUpdate && (
              <Restore
                className={`${baseClass}__restore`}
                collectionSlug={collectionConfig?.slug}
                globalSlug={globalConfig?.slug}
                label={collectionConfig?.labels.singular || globalConfig?.label}
                originalDocID={id}
                versionDate={formattedCreatedAt}
                versionID={versionID}
              />
            )}
          </header>
        </div>
        <div className={`${baseClass}__controls`}>
          {/* <CompareVersion
            baseURL={compareBaseURL}
            onChange={setCompareValue}
            parentID={parentID}
            publishedDoc={publishedDoc}
            value={compareValue}
            versionID={versionID}
          /> */}
          {/* {localization && (
            <SelectLocales onChange={setLocales} options={localeOptions} value={locales} />
          )} */}
        </div>
        {doc?.version && (
          <RenderFieldsToDiff
            comparison={comparison}
            fieldComponents={fieldComponents}
            fieldPermissions={docPermissions?.fields}
            fields={fields}
            locales={
              locales
                ? locales.map(({ label }) => (typeof label === 'string' ? label : undefined))
                : []
            }
            version={doc?.version}
            i18n={i18n}
            locale={locale}
            config={config}
          />
        )}
      </Gutter>
    </main>
  )
}
