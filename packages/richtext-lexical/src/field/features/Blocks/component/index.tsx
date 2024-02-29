'use client'
import {
  FieldPathProvider,
  Form,
  type FormProps,
  type FormState,
  buildInitialState,
  buildStateFromSchema,
  getFormState,
  useConfig,
  useDocumentInfo,
  useFieldPath,
  useFormSubmitted,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { type BlockFields } from '../nodes/BlocksNode'
const baseClass = 'lexical-block'

import type { Data } from 'payload/types'

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

  console.log('1. Loading node data', formData)

  const componentMapRenderedFieldsPath = `feature.blocks.fields.${formData?.blockType}`
  const schemaFieldsPath = `${schemaPath}.feature.blocks.${formData?.blockType}`

  const reducedBlock: ReducedBlock = (
    editorConfig?.resolvedFeatureMap?.get('blocks')
      ?.clientFeatureProps as ClientComponentProps<BlocksFeatureClientProps>
  )?.reducedBlocks?.find((block) => block.slug === formData?.blockType)

  const fieldMap = richTextComponentMap.get(componentMapRenderedFieldsPath) // Field Schema
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
        setInitialState(state)
      }
    }

    if (formData) {
      void awaitInitialState()
    }
  }, [config.routes.api, config.serverURL, schemaFieldsPath, id])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      return await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      })
    },

    [config.routes.api, config.serverURL, schemaFieldsPath, id],
  )

  // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
  //const formSchema = transformInputFormSchema(fieldMap, blockFieldWrapperName)

  const initialStateRef = React.useRef<Data>(null) // Store initial value in a ref, so it doesn't change on re-render and only gets initialized once

  console.log('Bloocks initialState', initialState)

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
  }, [fieldMap, parentLexicalRichTextField, nodeKey, submitted, initialState, reducedBlock])

  return <div className={baseClass}>{formContent}</div>
}
