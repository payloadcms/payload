'use client'

import type { FormProps } from '@payloadcms/ui/forms/Form'

import { Form } from '@payloadcms/ui/forms/Form'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { type BlockFields } from '../nodes/BlocksNode.js'
const baseClass = 'lexical-block'

import type { ReducedBlock } from '@payloadcms/ui/utilities/buildComponentMap'
import type { FormState } from 'payload/types'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useFormSubmitted } from '@payloadcms/ui/forms/Form'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { getFormState } from '@payloadcms/ui/utilities/getFormState'
import { v4 as uuid } from 'uuid'

import type { ClientComponentProps } from '../../types.js'
import type { BlocksFeatureClientProps } from '../feature.client.js'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider.js'
import { BlockContent } from './BlockContent.js'
import './index.scss'
import { removeEmptyArrayValues } from './removeEmptyArrayValues.js'

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
  const { path, schemaPath } = useFieldProps()
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
          ...removeEmptyArrayValues({ fields: state }),
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
        blockName: {
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
      initialState !== false && (
        <Form
          beforeSubmit={[onChange]}
          // @ts-expect-error TODO: Fix this
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
            formSchema={Array.isArray(fieldMap) ? fieldMap : []}
            nodeKey={nodeKey}
            path={`${path}.feature.blocks.${formData.blockType}`}
            reducedBlock={reducedBlock}
            schemaPath={schemaFieldsPath}
          />
        </Form>
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
    schemaFieldsPath,
    path,
  ]) // Adding formData to the dependencies here might break it

  return <div className={baseClass}>{formContent}</div>
}
