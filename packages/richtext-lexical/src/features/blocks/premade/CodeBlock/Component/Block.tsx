'use client'
import type {} from 'payload'

import {
  ChevronIcon,
  CopyToClipboard,
  Popup,
  PopupList,
  RenderFields,
  useForm,
  useFormFields,
} from '@payloadcms/ui'
import React from 'react'

import './index.scss'

import type { AdditionalCodeComponentProps } from './Code.js'

import { CodeBlockIcon } from '../../../../../lexical/ui/icons/CodeBlock/index.js'
import { useBlockComponentContext } from '../../../client/component/BlockContent.js'

const baseClass = 'payload-richtext-code-block'
export const CodeBlockBlockComponent: React.FC<
  Required<Pick<AdditionalCodeComponentProps, 'languages'>>
> = (args) => {
  const { languages } = args
  const { BlockCollapsible, formSchema } = useBlockComponentContext()
  const { setModified } = useForm()

  const { codeField } = useFormFields(([fields]) => ({
    codeField: fields?.code,
  }))

  const { selectedLanguageField, setSelectedLanguage } = useFormFields(([fields, dispatch]) => ({
    selectedLanguageField: fields?.language,
    setSelectedLanguage: (language: string) => {
      dispatch({
        type: 'UPDATE',
        path: 'language',
        value: language,
      })
      setModified(true)
    },
  }))

  const selectedLanguageLabel = languages[selectedLanguageField?.value as keyof typeof languages]

  return (
    <BlockCollapsible
      Actions={
        <div className={`${baseClass}__actions`}>
          <Popup
            button={
              <div
                className={`${baseClass}__language-selector-button`}
                data-selected-language={selectedLanguageField?.value}
              >
                <span>{selectedLanguageLabel}</span>
                <ChevronIcon className={`${baseClass}__chevron`} />
              </div>
            }
            className={`${baseClass}__language-selector`}
            horizontalAlign="right"
            render={({ close }) => (
              <PopupList.ButtonGroup>
                {Object.entries(languages).map(([languageCode, languageLabel]) => {
                  return (
                    <PopupList.Button
                      active={false}
                      disabled={false}
                      key={languageCode}
                      onClick={() => {
                        setSelectedLanguage(languageCode)
                        close()
                      }}
                    >
                      <span className={`${baseClass}__language-code`} data-language={languageCode}>
                        {languageLabel}
                      </span>
                    </PopupList.Button>
                  )
                })}
              </PopupList.ButtonGroup>
            )}
            showScrollbar
            size="large"
          />
          <CopyToClipboard value={(codeField?.value as string) ?? ''} />
        </div>
      }
      className={baseClass}
      Pill={
        <div className={`${baseClass}__pill`}>
          <CodeBlockIcon />
        </div>
      }
    >
      <RenderFields
        fields={formSchema}
        forceRender={true}
        parentIndexPath=""
        parentPath={''}
        parentSchemaPath=""
        permissions={true}
      />
    </BlockCollapsible>
  )
}
