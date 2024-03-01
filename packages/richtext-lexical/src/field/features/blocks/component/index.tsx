'use client'
import {
  FieldPathProvider,
  Form,
  type FormProps,
  type FormState,
  getFormState,
  useConfig,
  useDocumentInfo,
  useFieldPath,
  useFormSubmitted,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { type BlockFields } from '../nodes/BlocksNode'
const baseClass = 'lexical-block'

import type { Data } from 'payload/types'

import { v4 as uuid } from 'uuid'

import type { ReducedBlock } from '../../../../../../ui/src/utilities/buildComponentMap/types'
import type { ClientComponentProps } from '../../types'
import type { BlocksFeatureClientProps } from '../feature.client'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider'
import { BlockContent } from './BlockContent'
import './index.scss'

type Props = {
  blockFieldWrapperName: string
  children?: React.ReactNode

  formData: BlockFields
  nodeKey?: string
  /**
   * This transformedFormData already comes wrapped in blockFieldWrapperName
   */
  transformedFormData: BlockFields
}

export const BlockComponent: React.FC<Props> = (props) => {
  const { blockFieldWrapperName, formData, nodeKey } = props
  const config = useConfig()
  const submitted = useFormSubmitted()
  const { id } = useDocumentInfo()
  const { schemaPath } = useFieldPath()
  const { editorConfig, field: parentLexicalRichTextField } = useEditorConfigContext()

  const [initialState, setInitialState] = useState<FormState | false>(false)
  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

  const componentMapRenderedFieldsPath = `feature.blocks.fields.${formData?.blockType}`
  const schemaFieldsPath = `${schemaPath}.feature.blocks.${formData?.blockType}`

  const reducedBlock: ReducedBlock = (
    editorConfig?.resolvedFeatureMap?.get('blocks')
      ?.clientFeatureProps as ClientComponentProps<BlocksFeatureClientProps>
  )?.reducedBlocks?.find((block) => block.slug === formData?.blockType)

  const fieldMap = richTextComponentMap.get(componentMapRenderedFieldsPath)
  // Field Schema
  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          data: JSON.parse(JSON.stringify(formData)),
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      }) // Form State

      if (state) {
        setInitialState({
          ...state,
          blockName2: {
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
  }, [config.routes.api, config.serverURL, schemaFieldsPath, id])

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
        blockName2: {
          initialValue: '',
          passesCondition: true,
          valid: true,
          value: formData.blockName,
        },
      }
    },

    [config.routes.api, config.serverURL, schemaFieldsPath, id, formData.blockName],
  )

  // Memoized Form JSX
  const formContent = useMemo(() => {
    return (
      reducedBlock &&
      initialState && (
        <FieldPathProvider path="" schemaPath="">
          <Form
            fields={fieldMap}
            initialState={initialState}
            onChange={[onChange]}
            submitted={submitted}
            uuid={uuid()}
          >
            <BlockContent
              baseClass={baseClass}
              field={parentLexicalRichTextField}
              formData={formData}
              formSchema={fieldMap}
              nodeKey={nodeKey}
              reducedBlock={reducedBlock}
            />
          </Form>
        </FieldPathProvider>
      )
    )
  }, [
    fieldMap,
    parentLexicalRichTextField,
    nodeKey,
    submitted,
    initialState,
    reducedBlock,
    blockFieldWrapperName,
    onChange,
  ])

  return <div className={baseClass}>{formContent}</div>
}
