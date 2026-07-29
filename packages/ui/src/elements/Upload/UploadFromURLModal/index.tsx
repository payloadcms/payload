'use client'
import React from 'react'

import { TextInput } from '../../../fields/Text/Input.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { DialogBody, DialogFooter, DialogHeader, DialogModal } from '../../Dialog/index.js'

export const pasteURLDrawerSlug = 'upload-paste-url'

type Props = {
  readonly fileUrl: string
  readonly handleUrlSubmit: () => Promise<void>
  readonly isValidUrl: boolean
  readonly setFileUrl: (url: string) => void
}

export const UploadFromURLModal: React.FC<Props> = ({
  fileUrl,
  handleUrlSubmit,
  isValidUrl,
  setFileUrl,
}) => {
  const { t } = useTranslation()

  return (
    <DialogModal closeOnBlur slug={pasteURLDrawerSlug}>
      <DialogHeader showClose title={t('upload:fromURL')} />
      <DialogBody>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleUrlSubmit()
          }}
        >
          <TextInput
            label={t('upload:linkToFile')}
            onChange={(e) => setFileUrl(e.target.value)}
            path="url"
            placeholder="https://"
            value={fileUrl}
          />
        </form>
      </DialogBody>
      <DialogFooter>
        <Button buttonStyle="primary" disabled={!isValidUrl} onClick={() => void handleUrlSubmit()}>
          {t('upload:addFile')}
        </Button>
      </DialogFooter>
    </DialogModal>
  )
}
