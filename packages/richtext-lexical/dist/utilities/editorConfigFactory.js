import { defaultEditorConfig, defaultEditorFeatures } from '../lexical/config/server/default.js';
import { loadFeatures } from '../lexical/config/server/loader.js';
import { sanitizeServerFeatures } from '../lexical/config/server/sanitize.js';
import { getDefaultSanitizedEditorConfig } from './getDefaultSanitizedEditorConfig.js';
export const editorConfigFactory = {
  default: async args => {
    return getDefaultSanitizedEditorConfig({
      config: args.config,
      parentIsLocalized: args.parentIsLocalized ?? false
    });
  },
  /**
  * If you have instantiated a lexical editor and are accessing it outside a field (=> this is the unsanitized editor),
  * you can extract the editor config from it.
  * This is common if you define the editor in a re-usable module scope variable and pass it to the richText field.
  *
  * This is the least efficient way to get the editor config, and not recommended. It is recommended to extract the `features` arg
  * into a separate variable and use `fromFeatures` instead.
  */
  fromEditor: async args => {
    const lexicalAdapter = await args.editor({
      config: args.config,
      isRoot: args.isRoot ?? false,
      parentIsLocalized: args.parentIsLocalized ?? false
    });
    const sanitizedServerEditorConfig = lexicalAdapter.editorConfig;
    return sanitizedServerEditorConfig;
  },
  /**
  * Create a new editor config - behaves just like instantiating a new `lexicalEditor`
  */
  fromFeatures: async args => {
    return (await featuresInputToEditorConfig(args)).sanitizedConfig;
  },
  fromField: args => {
    const lexicalAdapter = args.field.editor;
    const sanitizedServerEditorConfig = lexicalAdapter.editorConfig;
    return sanitizedServerEditorConfig;
  },
  fromUnsanitizedField: async args => {
    const lexicalAdapterProvider = args.field.editor;
    const lexicalAdapter = await lexicalAdapterProvider({
      config: args.config,
      isRoot: args.isRoot ?? false,
      parentIsLocalized: args.parentIsLocalized ?? false
    });
    const sanitizedServerEditorConfig = lexicalAdapter.editorConfig;
    return sanitizedServerEditorConfig;
  }
};
export const featuresInputToEditorConfig = async args => {
  let features = [];
  if (args.features && typeof args.features === 'function') {
    const rootEditor = args.config.editor;
    let rootEditorFeatures = [];
    if (typeof rootEditor === 'object' && 'features' in rootEditor) {
      rootEditorFeatures = rootEditor.features;
    }
    features = args.features({
      defaultFeatures: defaultEditorFeatures,
      rootFeatures: rootEditorFeatures
    });
  } else {
    features = args.features;
  }
  if (!features) {
    features = defaultEditorFeatures;
  }
  const lexical = args.lexical ?? defaultEditorConfig.lexical;
  const resolvedFeatureMap = await loadFeatures({
    config: args.config,
    isRoot: args.isRoot ?? false,
    parentIsLocalized: args.parentIsLocalized ?? false,
    unSanitizedEditorConfig: {
      features,
      lexical
    }
  });
  return {
    features,
    resolvedFeatureMap,
    sanitizedConfig: {
      features: sanitizeServerFeatures(resolvedFeatureMap),
      lexical: args.lexical,
      resolvedFeatureMap
    }
  };
};
//# sourceMappingURL=editorConfigFactory.js.map