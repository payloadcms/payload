import type { GenericLanguages, I18n, I18nClient } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'
import type {
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  SerializedEditorState,
  SerializedLexicalNode,
} from 'lexical'
import type {
  Config,
  Field,
  FieldSchemaMap,
  JsonObject,
  PayloadComponent,
  PayloadRequest,
  PopulateType,
  ReplaceAny,
  RequestContext,
  RichTextField,
  RichTextHooks,
  SanitizedConfig,
  ValidateOptions,
  ValidationFieldError,
} from 'payload'

import type { ServerEditorConfig } from '../lexical/config/types.js'
import type { Transformer } from '../packages/@lexical/markdown/index.js'
import type { AdapterProps } from '../types.js'
import type { HTMLConverter } from './converters/lexicalToHtml_deprecated/converter/types.js'
import type { BaseClientFeatureProps } from './typesClient.js'

export type PopulationPromise<T extends SerializedLexicalNode = SerializedLexicalNode> = (args: {
  context: RequestContext
  currentDepth: number
  depth: number
  draft: boolean
  /**
   * This maps all population promises to the node type
   */
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
  field: RichTextField<SerializedEditorState, AdapterProps>
  /**
   * fieldPromises are used for things like field hooks. They will be awaited before awaiting populationPromises
   */
  fieldPromises: Promise<void>[]
  findMany: boolean
  flattenLocales: boolean
  node: T
  overrideAccess: boolean
  parentIsLocalized: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: JsonObject
}) => void

export type NodeValidation<T extends SerializedLexicalNode = SerializedLexicalNode> = ({
  node,
  nodeValidations,
  validation,
}: {
  node: T
  nodeValidations: Map<string, Array<NodeValidation>>
  validation: {
    options: ValidateOptions<unknown, unknown, RichTextField, SerializedEditorState>
    value: SerializedEditorState
  }
}) => Promise<string | true> | string | true

export type FeatureProviderProviderServer<
  UnSanitizedServerFeatureProps = undefined,
  ServerFeatureProps = UnSanitizedServerFeatureProps,
  ClientFeatureProps = undefined,
> = (
  props?: UnSanitizedServerFeatureProps,
) => FeatureProviderServer<UnSanitizedServerFeatureProps, ServerFeatureProps, ClientFeatureProps>

export type FeatureProviderServer<
  UnSanitizedServerFeatureProps = undefined,
  ServerFeatureProps = UnSanitizedServerFeatureProps,
  ClientFeatureProps = undefined,
> = {
  /** Keys of dependencies needed for this feature. These dependencies do not have to be loaded first, but they have to exist, otherwise an error will be thrown. */
  dependencies?: string[]
  /**  Keys of priority dependencies needed for this feature. These dependencies have to be loaded first AND have to exist, otherwise an error will be thrown. They will be available in the `feature` property. */
  dependenciesPriority?: string[]
  /** Keys of soft-dependencies needed for this feature. These are optional. Payload will attempt to load them before this feature, but doesn't throw an error if that's not possible. */
  dependenciesSoft?: string[]

  /**
   * This is being called during the payload sanitization process
   */
  feature:
    | ((props: {
        config: SanitizedConfig
        /** unSanitizedEditorConfig.features, but mapped */
        featureProviderMap: ServerFeatureProviderMap
        isRoot?: boolean
        parentIsLocalized: boolean
        // other resolved features, which have been loaded before this one. All features declared in 'dependencies' should be available here
        resolvedFeatures: ResolvedServerFeatureMap
        // unSanitized EditorConfig,
        unSanitizedEditorConfig: ServerEditorConfig
      }) =>
        | Promise<ServerFeature<ServerFeatureProps, ClientFeatureProps>>
        | ServerFeature<ServerFeatureProps, ClientFeatureProps>)
    | ServerFeature<ServerFeatureProps, ClientFeatureProps>
  key: string
  /** Props which were passed into your feature will have to be passed here. This will allow them to be used / read in other places of the code, e.g. wherever you can use useEditorConfigContext */
  serverFeatureProps: UnSanitizedServerFeatureProps
}

export type AfterReadNodeHookArgs<T extends SerializedLexicalNode> = {
  /**
   * Only available in `afterRead` hooks.
   */
  currentDepth: number
  /**
   * Only available in `afterRead` hooks.
   */
  depth: number
  draft: boolean
  fallbackLocale: string
  /**
   *  Only available in `afterRead` field hooks.
   */
  fieldPromises: Promise<void>[]
  /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
  findMany: boolean
  flattenLocales: boolean
  /**
   * The requested locale.
   */
  locale: string
  overrideAccess: boolean
  /**
   * Only available in `afterRead` hooks.
   */
  populateArg?: PopulateType
  /**
   *  Only available in `afterRead` field hooks.
   */
  populationPromises: Promise<void>[]
  /**
   * Only available in `afterRead` hooks.
   */
  showHiddenFields: boolean
  /**
   * Only available in `afterRead` hooks.
   */
  triggerAccessControl: boolean
  /**
   * Only available in `afterRead` hooks.
   */
  triggerHooks: boolean
}

export type AfterChangeNodeHookArgs<T extends SerializedLexicalNode> = {
  /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
  operation: 'create' | 'delete' | 'read' | 'update'
  /** The value of the node before any changes. Not available in afterRead hooks */
  originalNode: T
  previousNode: T
}
export type BeforeValidateNodeHookArgs<T extends SerializedLexicalNode> = {
  /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
  operation: 'create' | 'delete' | 'read' | 'update'
  /** The value of the node before any changes. Not available in afterRead hooks */
  originalNode: T
  overrideAccess: boolean
}

export type BeforeChangeNodeHookArgs<T extends SerializedLexicalNode> = {
  /**
   * Only available in `beforeChange` hooks.
   */
  errors: ValidationFieldError[]
  mergeLocaleActions: (() => Promise<void> | void)[]
  /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
  operation: 'create' | 'delete' | 'read' | 'update'
  /** The value of the node before any changes. Not available in afterRead hooks */
  originalNode: T
  /**
   * The original node with locales (not modified by any hooks).
   */
  originalNodeWithLocales?: T
  previousNode: T

  skipValidation: boolean
}

export type BaseNodeHookArgs<T extends SerializedLexicalNode> = {
  context: RequestContext
  /** The value of the node. */
  node: T
  parentRichTextFieldPath: (number | string)[]
  parentRichTextFieldSchemaPath: string[]
  /** The payload request object. It is mocked for Local API operations. */
  req: PayloadRequest
}

export type AfterReadNodeHook<T extends SerializedLexicalNode> = (
  args: AfterReadNodeHookArgs<T> & BaseNodeHookArgs<T>,
) => Promise<T> | T

export type AfterChangeNodeHook<T extends SerializedLexicalNode> = (
  args: AfterChangeNodeHookArgs<T> & BaseNodeHookArgs<T>,
) => Promise<T> | T

export type BeforeChangeNodeHook<T extends SerializedLexicalNode> = (
  args: BaseNodeHookArgs<T> & BeforeChangeNodeHookArgs<T>,
) => Promise<T> | T

export type BeforeValidateNodeHook<T extends SerializedLexicalNode> = (
  args: BaseNodeHookArgs<T> & BeforeValidateNodeHookArgs<T>,
) => Promise<T> | T

// Define the node with hooks that use the node's exportJSON return type
export type NodeWithHooks<T extends LexicalNode = any> = {
  /**
   * Allows you to define how a node can be serialized into different formats. Currently, only supports html.
   * Markdown converters are defined in `markdownTransformers` and not here.
   *
   * @deprecated - will be removed in 4.0
   */
  converters?: {
    /**
     * @deprecated - will be removed in 4.0
     */
    html?: HTMLConverter<ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>>
  }
  /**
   * If a node includes sub-fields (e.g. block and link nodes), passing those subFields here will make payload
   * automatically populate, run hooks, and generate component import maps for them
   */
  getSubFields?: (args: {
    /**
     * Optional. If not provided, all possible sub-fields should be returned.
     */
    node?: ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>
    req?: PayloadRequest
  }) => Field[] | null
  /**
   * If a node includes sub-fields, the sub-fields data needs to be returned here, alongside `getSubFields` which returns their schema.
   */
  getSubFieldsData?: (args: {
    node: ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>
    req: PayloadRequest
  }) => JsonObject
  /**
   * Allows you to run population logic when a node's data was requested from graphQL.
   * While `getSubFields` and `getSubFieldsData` automatically handle populating sub-fields (since they run hooks on them), those are only populated in the Rest API.
   * This is because the Rest API hooks do not have access to the 'depth' property provided by graphQL.
   * In order for them to be populated correctly in graphQL, the population logic needs to be provided here.
   */
  graphQLPopulationPromises?: Array<
    PopulationPromise<ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>>
  >
  /**
   * Just like payload fields, you can provide hooks which are run for this specific node. These are called Node Hooks.
   */
  hooks?: {
    afterChange?: Array<AfterChangeNodeHook<ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>>>
    afterRead?: Array<AfterReadNodeHook<ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>>>
    beforeChange?: Array<BeforeChangeNodeHook<ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>>>
    beforeValidate?: Array<
      BeforeValidateNodeHook<ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>>
    >
  }
  /**
   * The actual lexical node needs to be provided here. This also supports [lexical node replacements](https://lexical.dev/docs/concepts/node-replacement).
   */
  node: Klass<T> | LexicalNodeReplacement
  /**
   * This allows you to provide node validations, which are run when your document is being validated, alongside other payload fields.
   * You can use it to throw a validation error for a specific node in case its data is incorrect.
   */
  validations?: Array<NodeValidation<ReturnType<ReplaceAny<T, LexicalNode>['exportJSON']>>>
}

export type ServerFeature<ServerProps, ClientFeatureProps> = {
  ClientFeature?: PayloadComponent<never, BaseClientFeatureProps<ClientFeatureProps>>
  /**
   * This determines what props will be available on the Client.
   */
  clientFeatureProps?: ClientFeatureProps
  /**
   * Adds payload components to the importMap.
   *
   * If an object is provided, the imported components will automatically be made available to the client feature, keyed by the object's keys.
   */
  componentImports?:
    | {
        [key: string]: PayloadComponent
      }
    // @ts-expect-error - TODO: fix this
    | Config['admin']['importMap']['generators'][0]
    | PayloadComponent[]
  generatedTypes?: {
    modifyOutputSchema: (args: {
      collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
      config?: SanitizedConfig
      /**
       * Current schema which will be modified by this function.
       */
      currentSchema: JSONSchema4
      field: RichTextField<SerializedEditorState, AdapterProps>
      i18n?: I18n
      /**
       * Allows you to define new top-level interfaces that can be re-used in the output schema.
       */
      interfaceNameDefinitions: Map<string, JSONSchema4>
      isRequired: boolean
    }) => JSONSchema4
  }
  generateSchemaMap?: (args: {
    config: SanitizedConfig
    field: RichTextField
    i18n: I18nClient
    props: ServerProps
    schemaMap: FieldSchemaMap
    schemaPath: string
  }) => FieldSchemaMap | null
  hooks?: RichTextHooks
  /**
   * Here you can provide i18n translations for your feature. These will only be available on the server and client.
   *
   * Translations here are automatically scoped to `lexical.featureKey.yourKey`
   *
   * @Example
   * ```ts
   * i18n: {
   *   en: {
   *     label: 'Horizontal Rule',
   *   },
   *   de: {
   *     label: 'Trennlinie',
   *   },
   * }
   * ```
   * In order to access these translations, you would use `i18n.t('lexical:horizontalRule:label')`.
   */
  i18n?: Partial<GenericLanguages>
  markdownTransformers?: (
    | ((props: { allNodes: Array<NodeWithHooks>; allTransformers: Transformer[] }) => Transformer)
    | Transformer
  )[]
  nodes?: Array<NodeWithHooks>

  /** Props which were passed into your feature will have to be passed here. This will allow them to be used / read in other places of the code, e.g. wherever you can use useEditorConfigContext */
  sanitizedServerFeatureProps?: ServerProps
}

export type ResolvedServerFeature<ServerProps, ClientFeatureProps> = {
  order: number
} & Required<
  Pick<
    FeatureProviderServer<ServerProps, ClientFeatureProps>,
    'dependencies' | 'dependenciesPriority' | 'dependenciesSoft' | 'key'
  >
> &
  ServerFeature<ServerProps, ClientFeatureProps>

export type ResolvedServerFeatureMap = Map<string, ResolvedServerFeature<any, any>>

export type ServerFeatureProviderMap = Map<string, FeatureProviderServer<any, any, any>>

export type SanitizedServerFeatures = {
  /**  The node types mapped to their converters */
  converters: {
    html: HTMLConverter[]
  }
  /** The keys of all enabled features */
  enabledFeatures: string[]
  generatedTypes: {
    modifyOutputSchemas: Array<
      (args: {
        collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
        config?: SanitizedConfig
        /**
         * Current schema which will be modified by this function.
         */
        currentSchema: JSONSchema4
        field: RichTextField<SerializedEditorState, AdapterProps>
        i18n?: I18n
        /**
         * Allows you to define new top-level interfaces that can be re-used in the output schema.
         */
        interfaceNameDefinitions: Map<string, JSONSchema4>
        isRequired: boolean
      }) => JSONSchema4
    >
  }
  /**  The node types mapped to their hooks */

  getSubFields?: Map<
    string,
    (args: { node: SerializedLexicalNode; req: PayloadRequest }) => Field[] | null
  >
  getSubFieldsData?: Map<
    string,
    (args: { node: SerializedLexicalNode; req: PayloadRequest }) => JsonObject
  >
  graphQLPopulationPromises: Map<string, Array<PopulationPromise>>
  hooks: RichTextHooks
  markdownTransformers: Transformer[]
  nodeHooks?: {
    afterChange?: Map<string, Array<AfterChangeNodeHook<SerializedLexicalNode>>>
    afterRead?: Map<string, Array<AfterReadNodeHook<SerializedLexicalNode>>>
    beforeChange?: Map<string, Array<BeforeChangeNodeHook<SerializedLexicalNode>>>
    beforeValidate?: Map<string, Array<BeforeValidateNodeHook<SerializedLexicalNode>>>
  } /**  The node types mapped to their populationPromises */
  /**  The node types mapped to their validations */
  validations: Map<string, Array<NodeValidation>>
} & Required<Pick<ResolvedServerFeature<any, any>, 'i18n' | 'nodes'>>
