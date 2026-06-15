'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useEffect, useState } from 'react'

import { TextInput } from '../../../fields/Text/Input.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { DialogBody, DialogFooter, DialogHeader, DialogModal } from '../../Dialog/index.js'

export const renameFileModalSlug = 'upload-rename-file'

type Props = {
  readonly currentFilename: string
  readonly onConfirm: (newName: string) => void
}

export const UploadRenameModal: React.FC<Props> = ({ currentFilename, onConfirm }) => {
  const { closeModal } = useModal()
  const { t } = useTranslation()
  const [newName, setNewName] = useState(currentFilename)

  useEffect(() => {
    setNewName(currentFilename)
  }, [currentFilename])

  const isUnchanged = newName.trim() === currentFilename
  const isEmpty = !newName.trim()

  return (
    <DialogModal slug={renameFileModalSlug}>
      <DialogHeader showClose title={t('upload:renameFile')} />
      <DialogBody>
        <TextInput
          label={t('upload:fileName')}
          onChange={(e) => setNewName(e.target.value)}
          path="filename"
          value={newName}
        />
      </DialogBody>
      <DialogFooter>
        <Button buttonStyle="secondary" onClick={() => closeModal(renameFileModalSlug)}>
          {t('general:cancel')}
        </Button>
        <Button
          buttonStyle="primary"
          disabled={isEmpty || isUnchanged}
          onClick={() => {
            onConfirm(newName.trim())
            closeModal(renameFileModalSlug)
          }}
        >
          {t('general:rename')}
        </Button>
      </DialogFooter>
    </DialogModal>
  )
}
