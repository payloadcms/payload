'use client'
import type { CollapsibleProps } from '@payloadcms/ui/elements/Collapsible'
import type { ClientField } from 'payload'

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
  nodeKey: string
  parentPath: string
  parentSchemaPath: string
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
  nodeKey: '',
  parentPath: '',
  parentSchemaPath: '',
  RemoveButton: () => null,
})

export const useBlockComponentContext = () => React.use(BlockComponentContext)

export const BlockContent: React.FC<BlockContentProps> = (props) => {
  const { Collapsible, ...contextProps } = props

  const { BlockDrawer, CustomBlock, errorCount, formSchema, parentPath, parentSchemaPath } =
    contextProps

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
        parentPath={parentPath}
        parentSchemaPath={parentSchemaPath}
        permissions={true}
        readOnly={!isEditable}
      />
    </CollapsibleWithErrorProps>
  )
}
