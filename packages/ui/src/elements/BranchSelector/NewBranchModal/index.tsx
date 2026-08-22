'use client'

import { branchesCollectionSlug, formatAdminURL, MAIN_BRANCH } from 'payload/shared'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { TextInput } from '../../../fields/Text/Input.js'
import { BranchIcon } from '../../../icons/Branch/index.js'
import { useBranch } from '../../../providers/Branch/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import { Button } from '../../Button/index.js'
import { DialogBody, DialogFooter, DialogHeader, DialogModal } from '../../Dialog/index.js'
import { useModal } from '../../Modal/index.js'
import { Pill } from '../../Pill/index.js'
import './index.css'

export const newBranchModalSlug = 'new-branch'

const baseClass = 'new-branch-modal'

/**
 * Creates a branch without leaving the current view.
 *
 * The slug is derived from the name server-side rather than asked for, so the
 * only thing required here is a name — which is why this is a modal rather than
 * a trip to the collection's create view.
 */
export const NewBranchModal: React.FC = () => {
  const { t } = useTranslation()
  const { closeModal } = useModal()
  const { setBranch } = useBranch()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const trimmedName = name.trim()

  const reset = useCallback(() => {
    setName('')
    setDescription('')
  }, [])

  const handleCreate = useCallback(async () => {
    if (!trimmedName || isCreating) {
      return
    }

    setIsCreating(true)

    try {
      const trimmedDescription = description.trim()

      const response = await requests.post(
        formatAdminURL({ apiRoute: api, path: `/${branchesCollectionSlug}`, serverURL }),
        {
          body: JSON.stringify({
            name: trimmedName,
            ...(trimmedDescription ? { description: trimmedDescription } : {}),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      const json = (await response.json()) as {
        doc?: { slug?: string }
        errors?: {
          data?: { errors?: { message: string; path: string }[] }
          message: string
        }[]
      }

      if (!response.ok) {
        const fieldErrors = json?.errors?.flatMap(({ data }) => data?.errors ?? []) ?? []

        // Field errors are reported against `slug`, which is derived rather than
        // typed — naming it would point the editor at a field they never saw. The
        // name is what they control, so that is what the message names.
        const messages = fieldErrors.length
          ? fieldErrors.map(({ message, path }) =>
              path === 'slug' ? `${t('branching:branchName')}: ${message}` : message,
            )
          : (json?.errors?.map(({ message }) => message) ?? [])

        if (messages.length) {
          messages.forEach((message) => toast.error(message))
        } else {
          toast.error(t('error:unknown'))
        }

        return
      }

      closeModal(newBranchModalSlug)
      reset()

      // Creating a branch is a declaration of intent to work on it, so the
      // switch follows the save.
      if (json?.doc?.slug) {
        setBranch(json.doc.slug)
      }
    } catch (_err) {
      toast.error(t('error:unknown'))
    } finally {
      setIsCreating(false)
    }
  }, [api, closeModal, description, isCreating, reset, serverURL, setBranch, t, trimmedName])

  return (
    <DialogModal className={baseClass} closeOnBlur slug={newBranchModalSlug}>
      <DialogHeader showClose title={t('branching:createNewBranch')} />
      <DialogBody>
        <form
          className={`${baseClass}__form`}
          onSubmit={(e) => {
            e.preventDefault()
            void handleCreate()
          }}
        >
          <TextInput
            label={t('branching:branchName')}
            onChange={(e) => setName(e.target.value)}
            path="name"
            required
            value={name}
          />
          <TextInput
            label={t('branching:branchDescription')}
            onChange={(e) => setDescription(e.target.value)}
            path="description"
            value={description}
          />
          {/* Display-only: branching from a branch is not supported, so `main` is
              the only possible source and there is nothing here to choose. */}
          <div className={`${baseClass}__source`}>
            <span className={`${baseClass}__source-label`}>{t('branching:branchedFrom')}</span>
            <div className={`${baseClass}__source-value`}>
              <BranchIcon size={24} />
              <span className={`${baseClass}__source-name`}>{MAIN_BRANCH}</span>
              <Pill pillStyle="light-gray" size="small">
                {t('branching:defaultBranch')}
              </Pill>
            </div>
          </div>
        </form>
      </DialogBody>
      <DialogFooter>
        <Button
          buttonStyle="secondary"
          disabled={isCreating}
          onClick={() => {
            closeModal(newBranchModalSlug)
            reset()
          }}
          size="medium"
        >
          {t('general:cancel')}
        </Button>
        <Button
          buttonStyle="primary"
          disabled={!trimmedName || isCreating}
          onClick={() => void handleCreate()}
          size="medium"
        >
          {isCreating ? t('general:creating') : t('branching:createAndSwitch')}
        </Button>
      </DialogFooter>
    </DialogModal>
  )
}
