'use client'

import type { FormStateWithoutComponents } from 'payload'

import { type FC, useCallback } from 'react'
import { toast } from 'sonner'

import type { ClipboardCopyData, OnPasteFn } from './types.js'

import { ClipboardIcon } from '../../icons/Clipboard/index.js'
import { CopyIcon } from '../../icons/Copy/index.js'
import { MoreIcon } from '../../icons/More/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { clipboardCopy, clipboardPaste } from './clipboardUtilities.js'
import { useCanPasteClipboard } from './useCanPasteClipboard.js'
import './index.css'

const baseClass = 'clipboard-action'

type Props = {
  allowCopy?: boolean
  allowPaste?: boolean
  className?: string
  copyClassName?: string
  disabled?: boolean
  getDataToCopy: () => FormStateWithoutComponents
  isRow?: boolean
  onPaste: OnPasteFn
  pasteClassName?: string
} & ClipboardCopyData

/**
 * Menu actions for copying and pasting fields. Currently, this is only used in Arrays and Blocks.
 * @note This component doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
export const ClipboardAction: FC<Props> = ({
  allowCopy,
  allowPaste,
  className,
  copyClassName,
  disabled,
  isRow,
  onPaste,
  pasteClassName,
  path,
  ...rest
}) => {
  const { t } = useTranslation()

  const { canPaste, refresh } = useCanPasteClipboard(
    rest.type === 'array'
      ? { path, schemaFields: rest.fields }
      : { path, schemaBlocks: rest.blocks },
  )

  const classes = [`${baseClass}__popup`, className].filter(Boolean).join(' ')

  const handleCopy = useCallback(() => {
    const clipboardResult = clipboardCopy({
      path,
      t,
      ...rest,
    })

    if (typeof clipboardResult === 'string') {
      toast.error(clipboardResult)
    } else {
      toast.success(t('general:copied'))
    }
  }, [t, rest, path])

  const handlePaste = useCallback(() => {
    const clipboardResult = clipboardPaste(
      rest.type === 'array'
        ? {
            onPaste,
            path,
            schemaFields: rest.fields,
            t,
          }
        : {
            onPaste,
            path,
            schemaBlocks: rest.blocks,
            t,
          },
    )

    if (typeof clipboardResult === 'string') {
      toast.error(clipboardResult)
    }
  }, [onPaste, rest, path, t])

  if (!allowPaste && !allowCopy) {
    return null
  }

  return (
    <Popup
      button={<MoreIcon />}
      buttonAriaLabel={t('general:moreOptions')}
      buttonClassName={`${baseClass}__button`}
      caret={false}
      className={classes}
      disabled={disabled}
      horizontalAlign="right"
      onToggleOpen={(active) => {
        if (active) {
          refresh()
        }
      }}
      render={({ close }) => (
        <PopupList.MenuItem>
          <PopupList.Button
            className={copyClassName}
            disabled={!allowCopy}
            icon={<CopyIcon size={24} />}
            onClick={() => {
              void handleCopy()
              close()
            }}
          >
            {isRow ? t('general:copyRow') : t('general:copyField')}
          </PopupList.Button>
          <PopupList.Button
            className={pasteClassName}
            disabled={!allowPaste || !canPaste}
            icon={<ClipboardIcon />}
            onClick={() => {
              void handlePaste()
              close()
            }}
          >
            {isRow ? t('general:pasteRow') : t('general:pasteField')}
          </PopupList.Button>
        </PopupList.MenuItem>
      )}
      verticalAlign="bottom"
    />
  )
}
