import type { GenericLanguages, I18n, I18nClient } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'
import type React from 'react'

import type { SanitizedConfig } from '../config/types.js'
import type { Field, FieldBase, RichTextField, Validate } from '../fields/config/types.js'
import type { PayloadRequestWithData, RequestContext } from '../types/index.js'
import type { WithServerSidePropsComponentProps } from './elements/WithServerSideProps.js'

export type RichTextFieldProps<
  Value extends object,
  AdapterProps,
  ExtraFieldProperties = {},
> = Omit<RichTextField<Value, AdapterProps, ExtraFieldProperties>, 'type'> & {
  path?: string
}

type RichTextAdapterBase<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = {
  generateComponentMap: (args: {
    WithServerSideProps: React.FC<Omit<WithServerSidePropsComponentProps, 'serverOnlyProps'>>
    config: SanitizedConfig
    i18n: I18nClient
    schemaPath: string
  }) => Map<string, React.ReactNode>
  generateSchemaMap?: (args: {
    config: SanitizedConfig
    i18n: I18n<any, any>
    schemaMap: Map<string, Field[]>
    schemaPath: string
  }) => Map<string, Field[]>
  hooks?: FieldBase['hooks']
  i18n?: Partial<GenericLanguages>
  outputSchema?: ({
    collectionIDFieldTypes,
    config,
    field,
    interfaceNameDefinitions,
    isRequired,
  }: {
    collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
    config?: SanitizedConfig
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    /**
     * Allows you to define new top-level interfaces that can be re-used in the output schema.
     */
    interfaceNameDefinitions: Map<string, JSONSchema4>
    isRequired: boolean
  }) => JSONSchema4
  /**
   * Like an afterRead hook, but runs for both afterRead AND in the GraphQL resolver. For populating data, this should be used.
   *
   * To populate stuff / resolve field hooks, mutate the incoming populationPromises or fieldPromises array. They will then be awaited in the correct order within payload itself.
   * @param data
   */
  populationPromises?: (data: {
    context: RequestContext
    currentDepth?: number
    depth: number
    draft: boolean
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    fieldPromises: Promise<void>[]
    findMany: boolean
    flattenLocales: boolean
    overrideAccess?: boolean
    populationPromises: Promise<void>[]
    req: PayloadRequestWithData
    showHiddenFields: boolean
    siblingDoc: Record<string, unknown>
  }) => void
  validate: Validate<
    Value,
    Value,
    unknown,
    RichTextField<Value, AdapterProps, ExtraFieldProperties>
  >
}

export type RichTextAdapter<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = RichTextAdapterBase<Value, AdapterProps, ExtraFieldProperties> & {
  CellComponent: React.FC<any>
  FieldComponent: React.FC<RichTextFieldProps<Value, AdapterProps, ExtraFieldProperties>>
}

export type RichTextAdapterProvider<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = ({
  config,
  isRoot,
}: {
  config: SanitizedConfig
  /**
   * Whether or not this is the root richText editor, defined in the payload.config.ts.
   *
   * @default false
   */
  isRoot?: boolean
}) =>
  | Promise<RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>>
  | RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>
