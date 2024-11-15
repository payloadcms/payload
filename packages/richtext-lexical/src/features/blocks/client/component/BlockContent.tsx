'use client'
import type { ClientField, FormState } from 'payload'

import { RenderFields } from '@payloadcms/ui'
import React, { createContext, useMemo } from 'react'

import type { BlockFields } from '../../server/nodes/BlocksNode.js'

import { useFormSave } from './FormSavePlugin.js'

type Props = {
  baseClass: string
  BlockDrawer: React.FC
  Collapsible: React.FC<{
    children?: React.ReactNode
    editButton?: boolean
    errorCount?: number
    fieldHasErrors?: boolean
    /**
     * Override the default label with a custom label
     */
    Label?: React.ReactNode
    removeButton?: boolean
  }>
  CustomBlock: React.ReactNode
  EditButton: React.FC
  formData: BlockFields
  formSchema: ClientField[]
  initialState: false | FormState | undefined
  nodeKey: string

  RemoveButton: React.FC
}

type BlockComponentContextType = {
  BlockCollapsible?: React.FC<{
    children?: React.ReactNode
    editButton?: boolean
    /**
     * Override the default label with a custom label
     */
    Label?: React.ReactNode
    removeButton?: boolean
  }>
  EditButton?: React.FC
  initialState: false | FormState | undefined

  nodeKey?: string
  RemoveButton?: React.FC
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
    formData,
    formSchema,
    initialState,
    nodeKey,
    RemoveButton,
  } = props

  const { errorCount, fieldHasErrors } = useFormSave({ disabled: !initialState, formData, nodeKey })

  const CollapsibleWithErrorProps = useMemo(
    () =>
      (props: {
        children?: React.ReactNode
        editButton?: boolean

        /**
         * Override the default label with a custom label
         */
        Label?: React.ReactNode
        removeButton?: boolean
      }) => (
        <Collapsible
          editButton={props.editButton}
          errorCount={errorCount}
          fieldHasErrors={fieldHasErrors}
          Label={props.Label}
          removeButton={props.removeButton}
        >
          {props.children}
        </Collapsible>
      ),
    [Collapsible, fieldHasErrors, errorCount],
  )

  return CustomBlock ? (
    <BlockComponentContext.Provider
      value={{
        BlockCollapsible: CollapsibleWithErrorProps,
        EditButton,
        initialState,
        nodeKey,
        RemoveButton,
      }}
    >
      {CustomBlock}
      <BlockDrawer />
    </BlockComponentContext.Provider>
  ) : (
    <CollapsibleWithErrorProps>
      <RenderFields
        fields={formSchema}
        forceRender={true}
        parentIndexPath=""
        parentPath={''}
        parentSchemaPath=""
        permissions={true}
      />
    </CollapsibleWithErrorProps>
  )
}
