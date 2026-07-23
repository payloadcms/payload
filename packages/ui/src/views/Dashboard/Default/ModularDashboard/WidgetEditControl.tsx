'use client'

import type { Data } from 'payload'

import React, { useId } from 'react'

import { Button } from '../../../../elements/Button/index.js'
import { useModal } from '../../../../elements/Modal/index.js'
import { EditIcon } from '../../../../icons/Edit/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
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

  if (!hasEditableFields) {
    return null
  }

  return (
    <>
      <Button
        aria-label={`${t('general:edit')} ${widgetID}`}
        buttonStyle="secondary"
        className="widget-wrapper__edit-btn"
        icon={<EditIcon />}
        margin={false}
        onClick={() => {
          openModal(drawerSlug)
        }}
      />
      <WidgetConfigDrawer
        drawerSlug={drawerSlug}
        onSave={onSave}
        widget={widgetConfig}
        widgetData={widgetData}
      />
    </>
  )
}
