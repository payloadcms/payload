'use client'

import type { ClientWidget } from 'payload'

import { useId } from 'react'

import { Button } from '../../../../../elements/Button/index.js'
import { ItemsDrawer } from '../../../../../elements/ItemsDrawer/index.js'
import { useModal } from '../../../../../elements/Modal/index.js'
import { SwapIcon } from '../../../../../icons/Swap/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'

export function WidgetReplaceControl({
  onReplace,
  widgetLabel,
  widgets,
}: {
  onReplace: (args: { widgetSlug: string }) => void
  widgetLabel: string
  widgets: ClientWidget[]
}) {
  const { t } = useTranslation()
  const { openModal } = useModal()
  const drawerID = useId()
  const drawerSlug = `replace-widget-${drawerID}`

  return (
    <>
      <Button
        aria-label={`${t('general:replace')} ${widgetLabel}`}
        buttonStyle="ghost"
        className="widget-wrapper__replace-btn"
        extraButtonProps={{ 'aria-haspopup': 'dialog' }}
        icon={<SwapIcon />}
        margin={false}
        onClick={() => openModal(drawerSlug)}
        tooltip={t('general:replace')}
      />
      <ItemsDrawer
        drawerSlug={drawerSlug}
        items={widgets}
        onItemClick={(widget) => onReplace({ widgetSlug: widget.slug })}
        searchPlaceholder={t('dashboard:searchWidgets')}
        title={`${t('general:replace')} ${widgetLabel}`}
        variant="widgets"
      />
    </>
  )
}
