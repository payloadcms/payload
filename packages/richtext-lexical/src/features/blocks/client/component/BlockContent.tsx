'use client'
import type { ClientField, FormState } from 'payload'

import { RenderFields } from '@payloadcms/ui'
import React, { createContext, useMemo } from 'react'

import type { BlockFields } from '../../server/nodes/BlocksNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useFormSave } from './FormSavePlugin.js'

type Props = {
  baseClass: string
  BlockDrawer: React.FC
  Collapsible: React.FC<{
    children?: React.ReactNode
    fieldHasErrors?: boolean
    Label: React.ReactNode
  }>
  CustomBlock: React.ReactNode
  EditButton: React.FC
  formData: BlockFields
  formSchema: ClientField[]
  initialState: false | FormState | undefined
  Label: React.FC<{
    editButton?: boolean
    errorCount?: number
    fieldHasErrors?: boolean
  }>
  nodeKey: string
}

type BlockComponentContextType = {
  BlockCollapsible?: React.FC<{
    children?: React.ReactNode
    Label?: React.ReactNode
  }>
  EditButton?: React.FC
  initialState: false | FormState | undefined
  Label?: React.FC<{
    editButton?: boolean
  }>
  nodeKey?: string
}

const BlockComponentContext = createContext<BlockComponentContextType>({
  initialState: false,
})

export const useBlockComponentContext = () => React.useContext(BlockComponentContext)

/**
 * The actual content of the Block. This should be INSIDE a Form component,
 * scoped to the block. All format operations in here are thus scoped to the block's form, and
 * not the whole document.
 */
export const BlockContent: React.FC<Props> = (props) => {
  const {
    BlockDrawer,
    Collapsible,
    CustomBlock,
    EditButton,
    formSchema,
    initialState,
    Label,
    nodeKey,
  } = props
  const { formData } = props
  const {
    fieldProps: { permissions },
  } = useEditorConfigContext()

  const { errorCount, fieldHasErrors } = useFormSave({ disabled: !initialState, formData, nodeKey })

  const LabelWithErrorProps = useMemo(
    () => (props: { editButton?: boolean }) => (
      <Label
        editButton={props?.editButton}
        errorCount={errorCount}
        fieldHasErrors={fieldHasErrors}
      />
    ),
    [Label, errorCount, fieldHasErrors],
  )

  const CollapsibleWithErrorProps = useMemo(
    () => (props: { children?: React.ReactNode; Label?: React.ReactNode }) => (
      <Collapsible fieldHasErrors={fieldHasErrors} Label={props.Label}>
        {props.children}
      </Collapsible>
    ),
    [Collapsible, fieldHasErrors],
  )

  return CustomBlock ? (
    <BlockComponentContext.Provider
      value={{
        BlockCollapsible: CollapsibleWithErrorProps,
        EditButton,
        initialState,
        Label: LabelWithErrorProps,
        nodeKey,
      }}
    >
      {CustomBlock}
      <BlockDrawer />
    </BlockComponentContext.Provider>
  ) : (
    <CollapsibleWithErrorProps Label={<LabelWithErrorProps />}>
      <RenderFields
        fields={formSchema}
        forceRender={true}
        parentIndexPath=""
        parentPath={''}
        parentSchemaPath=""
        permissions={permissions} // TODO: Pass field permissions
      />
    </CollapsibleWithErrorProps>
  )
}
