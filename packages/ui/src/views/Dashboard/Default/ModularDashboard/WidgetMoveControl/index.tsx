'use client'

import { Button } from '../../../../../elements/Button/index.js'
import { Popup } from '../../../../../elements/Popup/index.js'
import * as PopupList from '../../../../../elements/Popup/PopupButtonList/index.js'
import { MoreIcon } from '../../../../../icons/More/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'

export function WidgetMoveControl({
  index,
  onMove,
  onOpenChange,
  total,
  widgetLabel,
}: {
  index: number
  onMove: (args: { moveToIndex: number }) => void
  onOpenChange: (isOpen: boolean) => void
  total: number
  widgetLabel: string
}) {
  const { t } = useTranslation()

  return (
    <Popup
      className="widget-wrapper__move-popup"
      onToggleClose={() => onOpenChange(false)}
      onToggleOpen={onOpenChange}
      popupType="menu"
      render={({ close }) => (
        <PopupList.ButtonGroup>
          <PopupList.Button
            disabled={index === 0}
            onClick={() => {
              onMove({ moveToIndex: index - 1 })
              close()
            }}
          >
            {t('general:moveUp')}
          </PopupList.Button>
          <PopupList.Button
            disabled={index === total - 1}
            onClick={() => {
              onMove({ moveToIndex: index + 1 })
              close()
            }}
          >
            {t('general:moveDown')}
          </PopupList.Button>
        </PopupList.ButtonGroup>
      )}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={`${t('general:move')} ${widgetLabel}`}
          buttonStyle="secondary"
          extraButtonProps={{ onKeyDown, ...ariaProps }}
          icon={<MoreIcon />}
          margin={false}
          onClick={onClick}
          selected={active}
        />
      )}
      size="small"
      verticalAlign="bottom"
    />
  )
}
