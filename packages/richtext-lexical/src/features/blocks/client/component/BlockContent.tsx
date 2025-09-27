'use client'
import type { ClientField, FormState } from 'payload'

import { RenderFields, useFormSubmitted } from '@payloadcms/ui'
import React, { createContext, useMemo } from 'react'

export type BlockCollapsibleProps = {
  children?: React.ReactNode
  /**
   * Additional className to the collapsible wrapper
   */
  className?: string

  disableBlockName?: boolean
  editButton?: boolean
  /**
   * Override the default label with a custom label
   */
  Label?: React.ReactNode
  removeButton?: boolean
}

export type BlockCollapsibleWithErrorProps = {
  errorCount?: number
  fieldHasErrors?: boolean
} & BlockCollapsibleProps

type Props = {
  baseClass: string
  BlockDrawer: React.FC
  Collapsible: React.FC<BlockCollapsibleWithErrorProps>
  CustomBlock: React.ReactNode
  EditButton: React.FC
  errorCount: number
  formSchema: ClientField[]
  initialState: false | FormState | undefined

  nodeKey: string
  RemoveButton: React.FC
}

type BlockComponentContextType = {
  BlockCollapsible?: React.FC<BlockCollapsibleProps>
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
    () => (props: BlockCollapsibleProps) => {
      const { children, ...rest } = props
      return (
        <Collapsible errorCount={errorCount} fieldHasErrors={fieldHasErrors} {...rest}>
          {children}
        </Collapsible>
      )
    },
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
