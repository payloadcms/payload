'use client'
import type { ComboboxEntry } from '@payloadcms/ui'
import type {} from 'payload'

import './index.scss'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  ChevronIcon,
  Combobox,
  CopyToClipboard,
  PopupList,
  RenderFields,
  useForm,
  useFormFields,
  useTranslation,
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

  const { BlockCollapsible, formSchema, parentPath, parentSchemaPath, RemoveButton } =
    useBlockComponentContext()
  const { setModified } = useForm()
  const { t } = useTranslation()

  const codePath = `${parentPath}.code`
  const languagePath = `${parentPath}.language`

  const { codeField } = useFormFields(([fields]) => ({
    codeField: fields?.[codePath],
  }))

  const { selectedLanguageField, setSelectedLanguage } = useFormFields(([fields, dispatch]) => ({
    selectedLanguageField: fields?.[languagePath],
    setSelectedLanguage: (language: string) => {
      dispatch({
        type: 'UPDATE',
        path: languagePath,
        value: language,
      })
      setModified(true)
    },
  }))

  const selectedLanguageLabel = languages[selectedLanguageField?.value as keyof typeof languages]

  const isEditable = useLexicalEditable()

  const languageEntries = React.useMemo<ComboboxEntry[]>(() => {
    return Object.entries(languages).map(([languageCode, languageLabel]) => ({
      name: `${languageCode} ${languageLabel}`,
      Component: (
        <PopupList.Button
          active={false}
          disabled={false}
          onClick={() => {
            setSelectedLanguage(languageCode)
          }}
        >
          <span className={`${baseClass}__language-code`} data-language={languageCode}>
            {languageLabel}
          </span>
        </PopupList.Button>
      ),
    }))
  }, [languages, setSelectedLanguage])

  return (
    <BlockCollapsible
      Actions={
        <div className={`${baseClass}__actions`}>
          <Combobox
            button={
              <div
                className={`${baseClass}__language-selector-button`}
                data-selected-language={selectedLanguageField?.value}
              >
                <span>{selectedLanguageLabel}</span>
                <ChevronIcon className={`${baseClass}__chevron`} />
              </div>
            }
            buttonType="custom"
            className={`${baseClass}__language-selector`}
            disabled={!isEditable}
            entries={languageEntries}
            horizontalAlign="right"
            minEntriesForSearch={8}
            searchPlaceholder={t('fields:searchForLanguage')}
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
        parentPath={parentPath}
        parentSchemaPath={parentSchemaPath}
        permissions={true}
        readOnly={!isEditable}
      />
    </BlockCollapsible>
  )
}
