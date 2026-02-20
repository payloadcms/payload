'use client'

import type { Data } from 'payload'

import { EditIcon, useConfig, useModal, useTranslation } from '@payloadcms/ui'
import React, { useId } from 'react'

import { WidgetConfigDrawer } from './WidgetConfigDrawer.js'

const getWidgetSlugFromID = (widgetID: string): string =>
  widgetID.slice(0, widgetID.lastIndexOf('-'))

export function WidgetEditControl({
  onSave,
  widgetData,
  widgetID,
}: {
  onSave: (data: Data) => void
  widgetData?: Record<string, unknown>
  widgetID: string
}) {
  const { t } = useTranslation()
  const { openModal } = useModal()
  const { widgets: configWidgets = [] } = useConfig().config.admin.dashboard ?? {}

  const widgetSlug = getWidgetSlugFromID(widgetID)
  const widgetConfig = configWidgets.find((widget) => widget.slug === widgetSlug)
  const hasEditableFields = Boolean(widgetConfig?.fields?.length)

  const drawerID = useId()
  const drawerSlug = `widget-editor-${drawerID}`

  return (
    <>
      <button
        className="widget-wrapper__edit-btn"
        disabled={!hasEditableFields}
        onClick={() => {
          openModal(drawerSlug)
        }}
        type="button"
      >
        <span className="sr-only">
          {t('general:edit')} {widgetID}
        </span>
        <EditIcon />
      </button>
      {widgetConfig?.fields?.length ? (
        <WidgetConfigDrawer
          drawerSlug={drawerSlug}
          onSave={onSave}
          widget={widgetConfig}
          widgetData={widgetData}
        />
      ) : null}
    </>
  )
}
