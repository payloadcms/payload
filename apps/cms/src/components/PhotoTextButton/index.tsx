'use client'

import type { UIFieldClientProps } from 'payload'

import { Button, toast, useConfig, useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui'
import React, { useState } from 'react'

import './index.css'

type Props = { enabled?: boolean } & UIFieldClientProps

type PhotoText = { alt: string; description: string; tags: string[]; title: string }

const baseClass = 'photo-text-button'

/**
 * "Generate with AI" in the sidebar of a photo: asks the CMS to write a new title, alt text,
 * description and tags (src/personal/photos/generateTextEndpoint.ts) and puts them in the form,
 * unsaved, so they can be reviewed first.
 */
export function PhotoTextButton({ enabled }: Props) {
  const { id } = useDocumentInfo()
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { dispatchFields, setModified } = useForm()
  const album = useFormFields(([fields]) => fields.album?.value)
  const location = useFormFields(([fields]) => fields.location?.value)
  const [isWorking, setIsWorking] = useState(false)

  if (!enabled) {
    return (
      <p className={`${baseClass}__hint`}>
        Set OPENAI_API_KEY in the CMS .env to write titles, descriptions and tags with AI.
      </p>
    )
  }

  if (!id) {
    return (
      <p className={`${baseClass}__hint`}>
        Uploading fills in empty texts with AI. Once saved, you can generate new ones here.
      </p>
    )
  }

  const generate = async () => {
    setIsWorking(true)

    try {
      const res = await fetch(`${serverURL}${api}/personal-photos/${id}/generate-text`, {
        body: JSON.stringify({ album, location }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<PhotoText>

      if (!res.ok) throw new Error(data.error || `The CMS answered ${res.status}.`)

      for (const path of ['title', 'alt', 'description', 'tags'] as const) {
        if (data[path]?.length) dispatchFields({ type: 'UPDATE', path, value: data[path] })
      }

      setModified(true)
      toast.success('New texts are in the form. Review them, then save.')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className={baseClass}>
      <Button buttonStyle="secondary" disabled={isWorking} margin={false} onClick={generate}>
        {isWorking ? 'Writing…' : 'Generate with AI'}
      </Button>
      <p className={`${baseClass}__hint`}>
        Replaces the title, alt text, description and tags with new ones written from the photo.
      </p>
    </div>
  )
}
