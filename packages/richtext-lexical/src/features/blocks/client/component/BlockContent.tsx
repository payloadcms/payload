'use client'
import type { ClientField, FormState } from 'payload'

import { RenderFields, useFormSubmitted } from '@payloadcms/ui'
import React, { createContext, useMemo } from 'react'

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
  errorCount: number
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

export const useBlockComponentContext = () => React.use(BlockComponentContext)

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
    errorCount,
    formSchema,
    initialState,
    nodeKey,
    RemoveButton,
  } = props

  const hasSubmitted = useFormSubmitted()

  const fieldHasErrors = hasSubmitted && errorCount > 0

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
    <BlockComponentContext
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
    </BlockComponentContext>
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
