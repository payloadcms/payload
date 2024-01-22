'use client'
import React, { Fragment, useCallback, useEffect, useState } from 'react'

import type { DocumentPreferences } from 'payload/types'

import { Collapsible } from '../../../../elements/Collapsible'
import { ErrorPill } from '../../../../elements/ErrorPill'
import { useDocumentInfo } from '../../../../providers/DocumentInfo'
import { usePreferences } from '../../../../providers/Preferences'
import { useTranslation } from '../../../..'
import { WatchChildErrors } from '../../../WatchChildErrors'

export const CollapsibleInput: React.FC<{
  initCollapsed?: boolean
  children: React.ReactNode
  path: string
  baseClass: string
  RowLabel?: React.ReactNode
  fieldPreferencesKey?: string
  pathSegments?: string[]
}> = (props) => {
  const { initCollapsed, children, path, baseClass, RowLabel, fieldPreferencesKey, pathSegments } =
    props

  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const [errorCount, setErrorCount] = useState(0)
  const { i18n } = useTranslation()

  const onToggle = useCallback(
    async (newCollapsedState: boolean) => {
      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)

      setPreference(preferencesKey, {
        ...existingPreferences,
        ...(path
          ? {
              fields: {
                ...(existingPreferences?.fields || {}),
                [path]: {
                  ...existingPreferences?.fields?.[path],
                  collapsed: newCollapsedState,
                },
              },
            }
          : {
              fields: {
                ...(existingPreferences?.fields || {}),
                [fieldPreferencesKey]: {
                  ...existingPreferences?.fields?.[fieldPreferencesKey],
                  collapsed: newCollapsedState,
                },
              },
            }),
      })
    },
    [preferencesKey, fieldPreferencesKey, getPreference, setPreference, path],
  )

  useEffect(() => {
    const fetchInitialState = async () => {
      const preferences = await getPreference(preferencesKey)
      if (preferences) {
        const initCollapsedFromPref = path
          ? preferences?.fields?.[path]?.collapsed
          : preferences?.fields?.[fieldPreferencesKey]?.collapsed
        setCollapsedOnMount(Boolean(initCollapsedFromPref))
      } else {
        setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false)
      }
    }

    fetchInitialState()
  }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed, path])

  if (typeof collapsedOnMount !== 'boolean') return null

  return (
    <Fragment>
      <WatchChildErrors pathSegments={pathSegments} setErrorCount={setErrorCount} />
      <Collapsible
        className={`${baseClass}__collapsible`}
        collapsibleStyle={errorCount > 0 ? 'error' : 'default'}
        header={
          <div className={`${baseClass}__row-label-wrap`}>
            {RowLabel}
            {errorCount > 0 && <ErrorPill count={errorCount} withMessage i18n={i18n} />}
          </div>
        }
        initCollapsed={collapsedOnMount}
        onToggle={onToggle}
      >
        {children}
      </Collapsible>
    </Fragment>
  )
}
