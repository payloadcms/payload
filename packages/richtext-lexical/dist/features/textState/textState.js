import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $forEachSelectedTextNode } from '@lexical/selection';
import { $getNodeByKey, $getState, $setState, createState, TextNode } from 'lexical';
import { useEffect } from 'react';
export function registerTextStates(state) {
  const stateMap = new Map();
  for (const stateKey in state) {
    const stateValues = state[stateKey];
    const stateConfig = createState(stateKey, {
      parse: value => typeof value === 'string' && Object.keys(stateValues).includes(value) ? value : undefined
    });
    stateMap.set(stateKey, {
      stateConfig,
      stateValues
    });
  }
  return stateMap;
}
export function setTextState(editor, stateMap, stateKey, value) {
  editor.update(() => {
    $forEachSelectedTextNode(textNode => {
      const stateMapEntry = stateMap.get(stateKey);
      if (!stateMapEntry) {
        throw new Error(`State config for ${stateKey} not found`);
      }
      $setState(textNode, stateMapEntry.stateConfig, value);
    });
  });
}
export function StatePlugin({
  stateMap
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerMutationListener(TextNode, mutatedNodes => {
      editor.getEditorState().read(() => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'destroyed') {
            continue;
          }
          const node = $getNodeByKey(nodeKey);
          const dom = editor.getElementByKey(nodeKey);
          if (!node || !dom) {
            continue;
          }
          const mergedStyles = Object.create(null);
          // Examples:
          // stateKey: 'color'
          // stateValue: 'bg-red'
          stateMap.forEach((stateEntry, stateKey) => {
            const stateValue = $getState(node, stateEntry.stateConfig);
            if (!stateValue) {
              // clear the previous dataset value for this key
              delete dom.dataset[stateKey];
              return;
            } // skip - nothing else to do
            dom.dataset[stateKey] = stateValue;
            const css = stateEntry.stateValues[stateValue]?.css;
            if (css) {
              // merge existing styles with the new ones
              Object.assign(mergedStyles, css);
            }
          });
          // wipe previous inline styles once, then set the merged ones
          dom.style.cssText = '';
          Object.assign(dom.style, mergedStyles);
        }
      });
    });
  }, [editor]);
  return null;
}
//# sourceMappingURL=textState.js.map