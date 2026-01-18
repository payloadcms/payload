'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary.js';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin.js';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin.js';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { BLUR_COMMAND, COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from 'lexical';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useEditorConfigContext } from './config/client/EditorConfigProvider.js';
import { EditorPlugin } from './EditorPlugin.js';
import { ClipboardPlugin } from './plugins/ClipboardPlugin/index.js';
import { DecoratorPlugin } from './plugins/DecoratorPlugin/index.js';
import { AddBlockHandlePlugin } from './plugins/handles/AddBlockHandlePlugin/index.js';
import { DraggableBlockPlugin } from './plugins/handles/DraggableBlockPlugin/index.js';
import { InsertParagraphAtEndPlugin } from './plugins/InsertParagraphAtEnd/index.js';
import { MarkdownShortcutPlugin } from './plugins/MarkdownShortcut/index.js';
import { NormalizeSelectionPlugin } from './plugins/NormalizeSelection/index.js';
import { SelectAllPlugin } from './plugins/SelectAllPlugin/index.js';
import { SlashMenuPlugin } from './plugins/SlashMenu/index.js';
import { TextPlugin } from './plugins/TextPlugin/index.js';
import { LexicalContentEditable } from './ui/ContentEditable.js';
export const LexicalEditor = props => {
  const $ = _c(12);
  const {
    editorConfig,
    editorContainerRef,
    isSmallWidthViewport,
    onChange
  } = props;
  const editorConfigContext = useEditorConfigContext();
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = _floatingAnchorElem => {
      if (_floatingAnchorElem !== null) {
        setFloatingAnchorElem(_floatingAnchorElem);
      }
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onRef = t0;
  let t1;
  let t2;
  if ($[1] !== editor || $[2] !== editorConfigContext) {
    t1 = () => {
      if (!editorConfigContext?.uuid) {
        console.error("Lexical Editor must be used within an EditorConfigProvider");
        return;
      }
      if (editorConfigContext?.parentEditor?.uuid) {
        editorConfigContext.parentEditor?.registerChild(editorConfigContext.uuid, editorConfigContext);
      }
      const handleFocus = () => {
        editorConfigContext.focusEditor(editorConfigContext);
      };
      const handleBlur = () => {
        editorConfigContext.blurEditor(editorConfigContext);
      };
      const unregisterFocus = editor.registerCommand(FOCUS_COMMAND, () => {
        handleFocus();
        return true;
      }, COMMAND_PRIORITY_LOW);
      const unregisterBlur = editor.registerCommand(BLUR_COMMAND, () => {
        handleBlur();
        return true;
      }, COMMAND_PRIORITY_LOW);
      return () => {
        unregisterFocus();
        unregisterBlur();
        editorConfigContext.parentEditor?.unregisterChild?.(editorConfigContext.uuid);
      };
    };
    t2 = [editor, editorConfigContext];
    $[1] = editor;
    $[2] = editorConfigContext;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== editorConfig || $[6] !== editorContainerRef || $[7] !== floatingAnchorElem || $[8] !== isEditable || $[9] !== isSmallWidthViewport || $[10] !== onChange) {
    t3 = _jsxs(React.Fragment, {
      children: [editorConfig.features.plugins?.map(_temp), _jsxs("div", {
        className: "editor-container",
        ref: editorContainerRef,
        children: [editorConfig.features.plugins?.map(_temp2), _jsx(RichTextPlugin, {
          contentEditable: _jsx("div", {
            className: "editor-scroller",
            children: _jsx("div", {
              className: "editor",
              ref: onRef,
              children: _jsx(LexicalContentEditable, {
                editorConfig
              })
            })
          }),
          ErrorBoundary: LexicalErrorBoundary
        }), _jsx(NormalizeSelectionPlugin, {}), isEditable && _jsx(InsertParagraphAtEndPlugin, {}), _jsx(DecoratorPlugin, {}), _jsx(ClipboardPlugin, {}), _jsx(TextPlugin, {
          features: editorConfig.features
        }), _jsx(SelectAllPlugin, {}), isEditable && _jsx(OnChangePlugin, {
          ignoreSelectionChange: true,
          onChange: (editorState, editor_0, tags) => {
            if (!tags.has("focus") || tags.size > 1) {
              if (onChange != null) {
                onChange(editorState, editor_0, tags);
              }
            }
          }
        }), floatingAnchorElem && _jsxs(React.Fragment, {
          children: [!isSmallWidthViewport && isEditable && _jsxs(React.Fragment, {
            children: [editorConfig.admin?.hideDraggableBlockElement ? null : _jsx(DraggableBlockPlugin, {
              anchorElem: floatingAnchorElem
            }), editorConfig.admin?.hideAddBlockButton ? null : _jsx(AddBlockHandlePlugin, {
              anchorElem: floatingAnchorElem
            })]
          }), editorConfig.features.plugins?.map(plugin_1 => {
            if (plugin_1.position === "floatingAnchorElem" && !(plugin_1.desktopOnly === true && isSmallWidthViewport)) {
              return _jsx(EditorPlugin, {
                anchorElem: floatingAnchorElem,
                clientProps: plugin_1.clientProps,
                plugin: plugin_1
              }, plugin_1.key);
            }
          }), isEditable && _jsx(React.Fragment, {
            children: _jsx(SlashMenuPlugin, {
              anchorElem: floatingAnchorElem
            })
          })]
        }), isEditable && _jsxs(React.Fragment, {
          children: [_jsx(HistoryPlugin, {}), editorConfig?.features?.markdownTransformers?.length > 0 && _jsx(MarkdownShortcutPlugin, {})]
        }), editorConfig.features.plugins?.map(_temp3), editorConfig.features.plugins?.map(_temp4)]
      }), editorConfig.features.plugins?.map(_temp5)]
    });
    $[5] = editorConfig;
    $[6] = editorContainerRef;
    $[7] = floatingAnchorElem;
    $[8] = isEditable;
    $[9] = isSmallWidthViewport;
    $[10] = onChange;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
};
function _temp(plugin) {
  if (plugin.position === "aboveContainer") {
    return _jsx(EditorPlugin, {
      clientProps: plugin.clientProps,
      plugin
    }, plugin.key);
  }
}
function _temp2(plugin_0) {
  if (plugin_0.position === "top") {
    return _jsx(EditorPlugin, {
      clientProps: plugin_0.clientProps,
      plugin: plugin_0
    }, plugin_0.key);
  }
}
function _temp3(plugin_2) {
  if (plugin_2.position === "normal") {
    return _jsx(EditorPlugin, {
      clientProps: plugin_2.clientProps,
      plugin: plugin_2
    }, plugin_2.key);
  }
}
function _temp4(plugin_3) {
  if (plugin_3.position === "bottom") {
    return _jsx(EditorPlugin, {
      clientProps: plugin_3.clientProps,
      plugin: plugin_3
    }, plugin_3.key);
  }
}
function _temp5(plugin_4) {
  if (plugin_4.position === "belowContainer") {
    return _jsx(EditorPlugin, {
      clientProps: plugin_4.clientProps,
      plugin: plugin_4
    }, plugin_4.key);
  }
}
//# sourceMappingURL=LexicalEditor.js.map