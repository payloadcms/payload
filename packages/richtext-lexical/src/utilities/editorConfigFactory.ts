import type { EditorConfig as LexicalEditorConfig } from 'lexical'
import type { RichTextAdapterProvider, RichTextField, SanitizedConfig } from 'payload'

import type { FeatureProviderServer, ResolvedServerFeatureMap } from '../features/typesServer.js'
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type {
  FeaturesInput,
  LexicalRichTextAdapter,
  LexicalRichTextAdapterProvider,
} from '../types.js'

import { getDefaultSanitizedEditorConfig } from '../getDefaultSanitizedEditorConfig.js'
import { defaultEditorConfig, defaultEditorFeatures } from '../lexical/config/server/default.js'
import { loadFeatures } from '../lexical/config/server/loader.js'
import { sanitizeServerFeatures } from '../lexical/config/server/sanitize.js'

export const editorConfigFactory = {
  default: async (args: {
    config: SanitizedConfig
    parentIsLocalized?: boolean
  }): Promise<SanitizedServerEditorConfig> => {
    return getDefaultSanitizedEditorConfig({
      config: args.config,
      parentIsLocalized: args.parentIsLocalized ?? false,
    })
  },
  /**
   * If you have instantiated a lexical editor and are accessing it outside a field (=> this is the unsanitized editor),
   * you can extract the editor config from it.
   * This is common if you define the editor in a re-usable module scope variable and pass it to the richText field.
   *
   * This is the least efficient way to get the editor config, and not recommended. It is recommended to extract the `features` arg
   * into a separate variable and use `fromFeatures` instead.
   */
  fromEditor: async (args: {
    config: SanitizedConfig
    editor: LexicalRichTextAdapterProvider
    isRoot?: boolean
    lexical?: LexicalEditorConfig
    parentIsLocalized?: boolean
  }): Promise<SanitizedServerEditorConfig> => {
    const lexicalAdapter: LexicalRichTextAdapter = await args.editor({
      config: args.config,
      isRoot: args.isRoot ?? false,
      parentIsLocalized: args.parentIsLocalized ?? false,
    })

    const sanitizedServerEditorConfig: SanitizedServerEditorConfig = lexicalAdapter.editorConfig
    return sanitizedServerEditorConfig
  },
  /**
   * Create a new editor config - behaves just like instantiating a new `lexicalEditor`
   */
  fromFeatures: async (args: {
    config: SanitizedConfig
    features?: FeaturesInput
    isRoot?: boolean
    lexical?: LexicalEditorConfig
    parentIsLocalized?: boolean
  }): Promise<SanitizedServerEditorConfig> => {
    return (await featuresInputToEditorConfig(args)).sanitizedConfig
  },
  fromField: (args: { field: RichTextField }): SanitizedServerEditorConfig => {
    const lexicalAdapter: LexicalRichTextAdapter = args.field.editor as LexicalRichTextAdapter

    const sanitizedServerEditorConfig: SanitizedServerEditorConfig = lexicalAdapter.editorConfig
    return sanitizedServerEditorConfig
  },
  fromUnsanitizedField: async (args: {
    config: SanitizedConfig
    field: RichTextField
    isRoot?: boolean
    parentIsLocalized?: boolean
  }): Promise<SanitizedServerEditorConfig> => {
    const lexicalAdapterProvider: RichTextAdapterProvider = args.field
      .editor as RichTextAdapterProvider

    const lexicalAdapter: LexicalRichTextAdapter = (await lexicalAdapterProvider({
      config: args.config,
      isRoot: args.isRoot ?? false,
      parentIsLocalized: args.parentIsLocalized ?? false,
    })) as LexicalRichTextAdapter

    const sanitizedServerEditorConfig: SanitizedServerEditorConfig = lexicalAdapter.editorConfig
    return sanitizedServerEditorConfig
  },
}

export const featuresInputToEditorConfig = async (args: {
  config: SanitizedConfig
  features?: FeaturesInput
  isRoot?: boolean
  lexical?: LexicalEditorConfig
  parentIsLocalized?: boolean
}): Promise<{
  features: FeatureProviderServer<unknown, unknown, unknown>[]
  resolvedFeatureMap: ResolvedServerFeatureMap
  sanitizedConfig: SanitizedServerEditorConfig
}> => {
  let features: FeatureProviderServer<unknown, unknown, unknown>[] = []
  if (args.features && typeof args.features === 'function') {
    const rootEditor = args.config.editor
    let rootEditorFeatures: FeatureProviderServer<unknown, unknown, unknown>[] = []
    if (typeof rootEditor === 'object' && 'features' in rootEditor) {
      rootEditorFeatures = (rootEditor as LexicalRichTextAdapter).features
    }
    features = args.features({
      defaultFeatures: defaultEditorFeatures,
      rootFeatures: rootEditorFeatures,
    })
  } else {
    features = args.features as FeatureProviderServer<unknown, unknown, unknown>[]
  }

  if (!features) {
    features = defaultEditorFeatures
  }

  const lexical = args.lexical ?? defaultEditorConfig.lexical

  const resolvedFeatureMap = await loadFeatures({
    config: args.config,
    isRoot: args.isRoot ?? false,
    parentIsLocalized: args.parentIsLocalized ?? false,
    unSanitizedEditorConfig: {
      features,
      lexical,
    },
  })

  return {
    features,
    resolvedFeatureMap,
    sanitizedConfig: {
      features: sanitizeServerFeatures(resolvedFeatureMap),
      lexical: args.lexical,
      resolvedFeatureMap,
    },
  }
}
