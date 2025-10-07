'use client'
import type {} from 'payload'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'

import './index.scss'

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

import type { AdditionalCodeComponentProps } from './Code.js'

import { CodeBlockIcon } from '../../../../../lexical/ui/icons/CodeBlock/index.js'
import { useBlockComponentContext } from '../../../client/component/BlockContent.js'
import { Collapse } from './Collapse/index.js'
import { defaultLanguages } from './defaultLanguages.js'
import { FloatingCollapse } from './FloatingCollapse/index.js'

const baseClass = 'payload-richtext-code-block'
export const CodeBlockBlockComponent: React.FC<Pick<AdditionalCodeComponentProps, 'languages'>> = (
  args,
) => {
  const { languages: languagesFromProps } = args
  const languages = languagesFromProps || defaultLanguages

  const { BlockCollapsible, formSchema, RemoveButton } = useBlockComponentContext()
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

  const isEditable = useLexicalEditable()

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
            disabled={!isEditable}
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

          <Collapse />

          {isEditable && <RemoveButton />}
        </div>
      }
      className={baseClass}
      collapsibleProps={{
        AfterCollapsible: <FloatingCollapse />,
        disableHeaderToggle: true,
        disableToggleIndicator: true,
      }}
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
        readOnly={!isEditable}
      />
    </BlockCollapsible>
  )
}
