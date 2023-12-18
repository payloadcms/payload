'use client'

import React, { useCallback } from 'react'
// TODO: fix this import to work in dev mode within the monorepo in a way that is backwards compatible with 1.x
// import UploadInput from 'payload/dist/admin/components/forms/field-types/Upload/Input'
import { UploadInput, useAllFormFields, useField } from 'payload/components/forms'
import { useConfig, useDocumentInfo, useLocale } from 'payload/components/utilities'

import { FieldType, Options } from 'payload/dist/admin/components/forms/useField/types'
import type { UploadInputProps } from 'payload/src/admin/components/forms/field-types/Upload/Input'

import { PluginConfig } from '../types'
import { Pill } from '../ui/Pill'

type UploadFieldWithProps = UploadInputProps & {
  path: string
  pluginConfig: PluginConfig
}

export const MetaImage: React.FC<UploadFieldWithProps | {}> = props => {
  const { label, relationTo, fieldTypes, name, pluginConfig } =
    (props as UploadFieldWithProps) || {} // TODO: this typing is temporary until payload types are updated for custom field props

  const field: FieldType<string> = useField(props as Options)

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const docInfo = useDocumentInfo()

  const { value, setValue, showError } = field

  const regenerateImage = useCallback(async () => {
    const { generateImage } = pluginConfig
    let generatedImage

    if (typeof generateImage === 'function') {
      generatedImage = await generateImage({
        ...docInfo,
        doc: { ...fields },
        locale: typeof locale === 'object' ? locale?.code : locale,
      })
    }

    setValue(generatedImage)
  }, [fields, setValue, pluginConfig, locale, docInfo])

  const hasImage = Boolean(value)

  const config = useConfig()

  const { collections, serverURL, routes: { api } = {} } = config

  const collection = collections?.find(coll => coll.slug === relationTo) || undefined

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div>
          {label && typeof label === 'string' && label}
          {typeof pluginConfig.generateImage === 'function' && (
            <>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={regenerateImage}
                type="button"
                style={{
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: 'currentcolor',
                }}
              >
                Auto-generate
              </button>
            </>
          )}
        </div>
        {typeof pluginConfig.generateImage === 'function' && (
          <div
            style={{
              color: '#9A9A9A',
            }}
          >
            Auto-generation will retrieve the selected hero image.
          </div>
        )}
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <UploadInput
          path={name}
          fieldTypes={fieldTypes}
          name={name}
          relationTo={relationTo}
          value={value}
          onChange={incomingImage => {
            if (incomingImage !== null) {
              const { id: incomingID } = incomingImage
              setValue(incomingID)
            } else {
              setValue(null)
            }
          }}
          label={undefined}
          showError={showError}
          api={api}
          collection={collection}
          serverURL={serverURL}
          filterOptions={{}}
          style={{
            marginBottom: 0,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Pill
          backgroundColor={hasImage ? 'green' : 'red'}
          color="white"
          label={hasImage ? 'Good' : 'No Image'}
        />
      </div>
    </div>
  )
}

export const getMetaImageField = (props: any) => <MetaImage {...props} />
