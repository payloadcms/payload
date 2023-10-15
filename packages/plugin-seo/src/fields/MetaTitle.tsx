'use client'

import React, { useCallback } from 'react'
import { useAllFormFields, useField } from 'payload/components/forms'
import { useDocumentInfo, useLocale } from 'payload/components/utilities'
import TextInputField from 'payload/dist/admin/components/forms/field-types/Text/Input'
import { Props as TextFieldType } from 'payload/dist/admin/components/forms/field-types/Text/types'
import { FieldType as FieldType, Options } from 'payload/dist/admin/components/forms/useField/types'

import { defaults } from '../defaults'
import { PluginConfig } from '../types'
import { LengthIndicator } from '../ui/LengthIndicator'

const { minLength, maxLength } = defaults.title

type TextFieldWithProps = TextFieldType & {
  path: string
  pluginConfig: PluginConfig
}

export const MetaTitle: React.FC<TextFieldWithProps | {}> = props => {
  const { label, name, path, pluginConfig } = (props as TextFieldWithProps) || {} // TODO: this typing is temporary until payload types are updated for custom field props

  const field: FieldType<string> = useField({
    label,
    name,
    path,
  } as Options)

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const docInfo = useDocumentInfo()

  const { value, setValue, showError } = field

  const regenerateTitle = useCallback(async () => {
    const { generateTitle } = pluginConfig
    let generatedTitle

    if (typeof generateTitle === 'function') {
      generatedTitle = await generateTitle({
        ...docInfo,
        doc: { ...fields },
        locale,
      })
    }

    setValue(generatedTitle)
  }, [fields, setValue, pluginConfig, locale, docInfo])

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
          {typeof pluginConfig.generateTitle === 'function' && (
            <>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={regenerateTitle}
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
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          {`This should be between ${minLength} and ${maxLength} characters. For help in writing quality meta titles, see `}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/title-link#page-titles"
            rel="noopener noreferrer"
            target="_blank"
          >
            best practices
          </a>
          .
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          marginBottom: '10px',
        }}
      >
        <TextInputField
          path={name}
          name={name}
          onChange={setValue}
          value={value}
          showError={showError}
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
        <LengthIndicator text={value as string} minLength={minLength} maxLength={maxLength} />
      </div>
    </div>
  )
}

export const getMetaTitleField = (props: any) => <MetaTitle {...props} />
