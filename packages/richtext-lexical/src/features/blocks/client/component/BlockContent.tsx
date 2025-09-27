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
   * Replace the default Label component with a custom Label
   */
  Label?: React.ReactNode
  /**
   * Replace the default Pill component component that's rendered within the default Label component with a custom Pill.
   * This property has no effect if you provide a custom Label component via the `Label` property.
   */
  Pill?: React.ReactNode
  removeButton?: boolean
}

export type BlockCollapsibleWithErrorProps = {
  errorCount?: number
  fieldHasErrors?: boolean
} & BlockCollapsibleProps

export type BlockContentProps = {
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
  BlockCollapsible: React.FC<BlockCollapsibleProps>
} & Omit<BlockContentProps, 'Collapsible'>

const BlockComponentContext = createContext<BlockComponentContextType>({
  baseClass: 'lexical-block',
  BlockCollapsible: () => null,
  BlockDrawer: () => null,
  CustomBlock: null,
  EditButton: () => null,
  errorCount: 0,
  formSchema: [],
  initialState: false,
  nodeKey: '',
  RemoveButton: () => null,
})

export const useBlockComponentContext = () => React.use(BlockComponentContext)

/**
 * The actual content of the Block. This should be INSIDE a Form component,
 * scoped to the block. All format operations in here are thus scoped to the block's form, and
 * not the whole document.
 */
export const BlockContent: React.FC<BlockContentProps> = (props) => {
  const { Collapsible, ...contextProps } = props

  const { BlockDrawer, CustomBlock, errorCount, formSchema } = contextProps

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
        ...contextProps,
        BlockCollapsible: CollapsibleWithErrorProps,
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
