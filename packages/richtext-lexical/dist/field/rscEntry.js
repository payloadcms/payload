import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { renderField } from '@payloadcms/ui/forms/renderField';
import React from 'react';
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { RichTextField } from '../exports/client/index.js';
import { buildInitialState } from '../utilities/buildInitialState.js';
import { initLexicalFeatures } from '../utilities/initLexicalFeatures.js';
export const RscEntryLexicalField = async args => {
  const field = args.field;
  const path = args.path ?? args.clientField.name;
  const schemaPath = args.schemaPath ?? path;
  const disabled = args?.readOnly || field?.admin?.readOnly;
  if (!args?.clientField?.name) {
    throw new Error('Initialized lexical RSC field without a field name');
  }
  const {
    clientFeatures,
    featureClientImportMap,
    featureClientSchemaMap
  } = initLexicalFeatures({
    clientFieldSchemaMap: args.clientFieldSchemaMap,
    fieldSchemaMap: args.fieldSchemaMap,
    i18n: args.i18n,
    path,
    payload: args.payload,
    sanitizedEditorConfig: args.sanitizedEditorConfig,
    schemaPath
  });
  let initialLexicalFormState = {};
  if (args.siblingData?.[field.name]?.root?.children?.length) {
    initialLexicalFormState = await buildInitialState({
      context: {
        id: args.id,
        clientFieldSchemaMap: args.clientFieldSchemaMap,
        collectionSlug: args.collectionSlug,
        disabled,
        documentData: args.data,
        field,
        fieldSchemaMap: args.fieldSchemaMap,
        lexicalFieldSchemaPath: schemaPath,
        operation: args.operation,
        permissions: args.permissions,
        preferences: args.preferences,
        renderFieldFn: renderField,
        req: args.req
      },
      nodeData: args.siblingData?.[field.name]?.root?.children
    });
  }
  const placeholderFromArgs = args.admin?.placeholder;
  const placeholder = placeholderFromArgs ? getTranslation(placeholderFromArgs, args.i18n) : undefined;
  const admin = {};
  if (placeholder) {
    admin.placeholder = placeholder;
  }
  if (args.admin?.hideGutter) {
    admin.hideGutter = true;
  }
  if (args.admin?.hideInsertParagraphAtEnd) {
    admin.hideInsertParagraphAtEnd = true;
  }
  if (args.admin?.hideAddBlockButton) {
    admin.hideAddBlockButton = true;
  }
  if (args.admin?.hideDraggableBlockElement) {
    admin.hideDraggableBlockElement = true;
  }
  const props = {
    clientFeatures,
    featureClientSchemaMap,
    field: args.clientField,
    forceRender: args.forceRender,
    initialLexicalFormState,
    lexicalEditorConfig: args.sanitizedEditorConfig.lexical,
    path,
    permissions: args.permissions,
    readOnly: args.readOnly,
    renderedBlocks: args.renderedBlocks,
    schemaPath
  };
  if (Object.keys(admin).length) {
    props.admin = admin;
  }
  if (Object.keys(featureClientImportMap).length) {
    props.featureClientImportMap = featureClientImportMap;
  }
  for (const key in props) {
    if (props[key] === undefined) {
      delete props[key];
    }
  }
  return /*#__PURE__*/_jsx(RichTextField, {
    ...props
  });
};
//# sourceMappingURL=rscEntry.js.map