'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { useEditDepth } from '@payloadcms/ui';
import * as React from 'react';
import { useMemo } from 'react';
import { EditorConfigProvider, useEditorConfigContext } from './config/client/EditorConfigProvider.js';
import { LexicalEditor as LexicalEditorComponent } from './LexicalEditor.js';
import { getEnabledNodes } from './nodes/index.js';
const NestProviders = ({
  children,
  providers
}) => {
  if (!providers?.length) {
    return children;
  }
  const Component = providers[0];
  if (providers.length > 1) {
    return /*#__PURE__*/_jsx(Component, {
      children: /*#__PURE__*/_jsx(NestProviders, {
        providers: providers.slice(1),
        children: children
      })
    });
  }
  return /*#__PURE__*/_jsx(Component, {
    children: children
  });
};
export const LexicalProvider = props => {
  const {
    composerKey,
    editorConfig,
    fieldProps,
    isSmallWidthViewport,
    onChange,
    readOnly,
    value
  } = props;
  const parentContext = useEditorConfigContext();
  const editDepth = useEditDepth();
  const editorContainerRef = React.useRef(null);
  // useMemo for the initialConfig that depends on readOnly and value
  const initialConfig = useMemo(() => {
    if (value && typeof value !== 'object') {
      throw new Error('The value passed to the Lexical editor is not an object. This is not supported. Please remove the data from the field and start again. This is the value that was passed in: ' + JSON.stringify(value));
    }
    if (value && Array.isArray(value) && !('root' in value)) {
      throw new Error('You have tried to pass in data from the old Slate editor to the new Lexical editor. The data structure is different, thus you will have to migrate your data. We offer a one-line migration script which migrates all your rich text fields: https://payloadcms.com/docs/lexical/migration#migration-via-migration-script-recommended');
    }
    if (value && 'jsonContent' in value) {
      throw new Error('You have tried to pass in data from payload-plugin-lexical. The data structure is different, thus you will have to migrate your data. Migration guide: https://payloadcms.com/docs/lexical/migration#migrating-from-payload-plugin-lexical');
    }
    return {
      editable: readOnly !== true,
      editorState: value != null ? JSON.stringify(value) : undefined,
      namespace: editorConfig.lexical.namespace,
      nodes: getEnabledNodes({
        editorConfig
      }),
      onError: error => {
        throw error;
      },
      theme: editorConfig.lexical.theme
    };
    // Important: do not add readOnly and value to the dependencies array. This will cause the entire lexical editor to re-render if the document is saved, which will
    // cause the editor to lose focus.
  }, [editorConfig]);
  if (!initialConfig) {
    return /*#__PURE__*/_jsx("p", {
      children: "Loading..."
    });
  }
  // We need to add initialConfig.editable to the key to force a re-render when the readOnly prop changes.
  // Without it, there were cases where lexical editors inside drawers turn readOnly initially - a few miliseconds later they turn editable, but the editor does not re-render and stays readOnly.
  return /*#__PURE__*/_jsx(LexicalComposer, {
    initialConfig: initialConfig,
    children: /*#__PURE__*/_jsx(EditorConfigProvider, {
      editorConfig: editorConfig,
      editorContainerRef: editorContainerRef,
      fieldProps: fieldProps,
      /**
      * Parent editor is not truly the parent editor, if the current editor is part of a drawer and the parent editor is the main editor.
      */
      parentContext: parentContext?.editDepth === editDepth ? parentContext : undefined,
      children: /*#__PURE__*/_jsx(NestProviders, {
        providers: editorConfig.features.providers,
        children: /*#__PURE__*/_jsx(LexicalEditorComponent, {
          editorConfig: editorConfig,
          editorContainerRef: editorContainerRef,
          isSmallWidthViewport: isSmallWidthViewport,
          onChange: onChange
        })
      })
    })
  }, composerKey + initialConfig.editable);
};
//# sourceMappingURL=LexicalProvider.js.map