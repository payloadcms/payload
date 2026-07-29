import { Button, ChevronIcon, useTranslation } from '@payloadcms/ui'
import React from 'react'

type ReindexButtonLabelProps = {
  readonly active?: boolean
  readonly 'aria-expanded'?: boolean
  readonly 'aria-haspopup'?: true
  readonly onClick?: React.MouseEventHandler
  readonly onKeyDown?: React.KeyboardEventHandler
}

export const ReindexButtonLabel: React.FC<ReindexButtonLabelProps> = ({
  active,
  onClick,
  onKeyDown,
  ...ariaProps
}) => {
  const {
    i18n: { t },
  } = useTranslation()
  return (
    <Button
      buttonStyle="secondary"
      extraButtonProps={{ onKeyDown }}
      icon={<ChevronIcon direction={active ? 'up' : 'down'} size={16} />}
      iconPosition="right"
      onClick={onClick}
      selected={active}
      size="medium"
      {...ariaProps}
    >
      {t('general:reindex')}
    </Button>
  )
}
