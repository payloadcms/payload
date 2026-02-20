'use client'
import type { CollapsibleProps } from '@payloadcms/ui/elements/Collapsible'
import type { ClientField, FormState } from 'payload'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { RenderFields, useFormSubmitted } from '@payloadcms/ui'
import React, { createContext, useMemo } from 'react'

export type BlockCollapsibleProps = {
  /**
   * Replace the top-right portion of the header that renders the Edit and Remove buttons with custom content.
   * If this property is provided, the `removeButton` and `editButton` properties are ignored.
   */
  Actions?: React.ReactNode
  children?: React.ReactNode
  /**
   * Additional className to the collapsible wrapper
   */
  className?: string
  /**
   * Props to pass to the underlying Collapsible component. You could use this to override the `Header` entirely, for example.
   */
  collapsibleProps?: Partial<CollapsibleProps>
  /**
   * Whether to disable rendering the block name field in the header Label
   * @default false
   */
  disableBlockName?: boolean
  /**
   * Whether to show the Edit button
   * If `Actions` is provided, this property is ignored.
   * @default true
   */
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
  /**
   * Whether to show the Remove button
   * If `Actions` is provided, this property is ignored.
   * @default true
   */
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
  baseClass: 'LexicalEditorTheme__block',
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
  const isEditable = useLexicalEditable()

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
        readOnly={!isEditable}
      />
    </CollapsibleWithErrorProps>
  )
}
