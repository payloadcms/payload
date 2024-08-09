'use client'

import type { FormProps } from '@payloadcms/ui'

import {
  Collapsible,
  Form,
  Pill,
  RenderComponent,
  SectionTitle,
  ShimmerEffect,
  useConfig,
  useDocumentInfo,
  useFieldProps,
  useFormSubmitted,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

const baseClass = 'lexical-block'
import type { BlockFieldClient, FormState } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { getFormState } from '@payloadcms/ui/shared'
import { v4 as uuid } from 'uuid'

import type { BlockFields } from '../../server/nodes/BlocksNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { BlockContent } from './BlockContent.js'
import './index.scss'

type Props = {
  readonly children?: React.ReactNode
  readonly formData: BlockFields
  readonly nodeKey?: string
}

export const BlockComponent: React.FC<Props> = (props) => {
  const { formData, nodeKey } = props
  const { config } = useConfig()
  const submitted = useFormSubmitted()
  const { id } = useDocumentInfo()
  const { path, schemaPath } = useFieldProps()
  const { field: parentLexicalRichTextField } = useEditorConfigContext()

  const [initialState, setInitialState] = useState<FormState | false>(false)
  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

  const schemaFieldsPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.lexical_blocks.${formData.blockType}`

  const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_blocks`
  const blocksField: BlockFieldClient = richTextComponentMap.get(componentMapRenderedBlockPath)[0]

  const clientBlock = blocksField.blocks.find((block) => block.slug === formData.blockType)

  // Field Schema
  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          data: formData,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      })

      if (state) {
        setInitialState({
          ...state,
          blockName: {
            initialValue: '',
            passesCondition: true,
            valid: true,
            value: formData.blockName,
          },
        })
      }
    }

    if (formData) {
      void awaitInitialState()
    }
  }, [config.routes.api, config.serverURL, schemaFieldsPath, id]) // DO NOT ADD FORMDATA HERE! Adding formData will kick you out of sub block editors while writing.

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const formState = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      })

      return {
        ...formState,
        blockName: {
          initialValue: '',
          passesCondition: true,
          valid: true,
          value: formData.blockName,
        },
      }
    },

    [config.routes.api, config.serverURL, id, schemaFieldsPath, formData.blockName],
  )
  const { i18n } = useTranslation()

  const classNames = [`${baseClass}__row`, `${baseClass}__row--no-errors`].filter(Boolean).join(' ')

  // Memoized Form JSX
  const formContent = useMemo(() => {
    return clientBlock && initialState !== false ? (
      <Form
        beforeSubmit={[onChange]}
        fields={clientBlock.fields}
        initialState={initialState}
        onChange={[onChange]}
        submitted={submitted}
        uuid={uuid()}
      >
        <BlockContent
          baseClass={baseClass}
          clientBlock={clientBlock}
          field={parentLexicalRichTextField}
          formData={formData}
          formSchema={clientBlock.fields}
          nodeKey={nodeKey}
          path={`${path}.lexical_internal_feature.blocks.${formData.blockType}`}
          schemaPath={schemaFieldsPath}
        />
      </Form>
    ) : (
      <Collapsible
        className={classNames}
        collapsibleStyle="default"
        header={
          clientBlock?.admin?.components?.Label ? (
            <RenderComponent
              clientProps={{ blockKind: 'lexicalBlock', formData }}
              mappedComponent={clientBlock.admin.components.Label}
            />
          ) : (
            <div className={`${baseClass}__block-header`}>
              <div>
                <Pill
                  className={`${baseClass}__block-pill ${baseClass}__block-pill-${formData?.blockType}`}
                  pillStyle="white"
                >
                  {clientBlock && typeof clientBlock.labels.singular === 'string'
                    ? getTranslation(clientBlock.labels.singular, i18n)
                    : clientBlock.slug}
                </Pill>
                <SectionTitle
                  path="blockName"
                  readOnly={parentLexicalRichTextField?.admin?.readOnly}
                />
              </div>
            </div>
          )
        }
        key={0}
      >
        <ShimmerEffect height="35vh" />
      </Collapsible>
    )
  }, [
    clientBlock,
    initialState,
    onChange,
    submitted,
    parentLexicalRichTextField,
    nodeKey,
    path,
    schemaFieldsPath,
    classNames,
    i18n, // Adding formData to the dependencies here might break it. DO NOT ADD FORMDATA!!!
  ])

  return <div className={baseClass + ' ' + baseClass + '-' + formData.blockType}>{formContent}</div>
}
