'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import { registerMarkdownShortcuts } from '../../../packages/@lexical/markdown/MarkdownShortcuts.js';
import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js';
export const MarkdownShortcutPlugin = () => {
  const $ = _c(4);
  const {
    editorConfig
  } = useEditorConfigContext();
  const [editor] = useLexicalComposerContext();
  let t0;
  let t1;
  if ($[0] !== editor || $[1] !== editorConfig.features.markdownTransformers) {
    t0 = () => registerMarkdownShortcuts(editor, editorConfig.features.markdownTransformers ?? []);
    t1 = [editor, editorConfig.features.markdownTransformers];
    $[0] = editor;
    $[1] = editorConfig.features.markdownTransformers;
    $[2] = t0;
    $[3] = t1;
  } else {
    t0 = $[2];
    t1 = $[3];
  }
  React.useEffect(t0, t1);
  return null;
};
//# sourceMappingURL=index.js.map