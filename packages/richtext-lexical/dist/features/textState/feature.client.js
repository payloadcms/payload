'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { TextStateIcon } from '../../lexical/ui/icons/TextState/index.js';
import { createClientFeature } from '../../utilities/createClientFeature.js';
import { registerTextStates, setTextState, StatePlugin } from './textState.js';
const toolbarGroups = (props, stateMap) => {
  const items = [];
  for (const stateKey in props.state) {
    const key = props.state[stateKey];
    for (const stateValue in key) {
      const meta = key[stateValue];
      items.push({
        ChildComponent: () => /*#__PURE__*/_jsx(TextStateIcon, {
          css: meta.css
        }),
        key: stateValue,
        label: meta.label,
        onSelect: ({
          editor
        }) => {
          setTextState(editor, stateMap, stateKey, stateValue);
        }
      });
    }
  }
  const clearStyle = [{
    ChildComponent: () => /*#__PURE__*/_jsx(TextStateIcon, {}),
    key: `clear-style`,
    label: ({
      i18n
    }) => i18n.t('lexical:textState:defaultStyle'),
    onSelect: ({
      editor
    }) => {
      for (const stateKey in props.state) {
        setTextState(editor, stateMap, stateKey, undefined);
      }
    },
    order: 1
  }];
  return [{
    type: 'dropdown',
    ChildComponent: () => /*#__PURE__*/_jsx(TextStateIcon, {
      css: {
        color: 'var(--theme-elevation-600)'
      }
    }),
    items: [...clearStyle, ...items],
    key: 'textState',
    order: 30
  }];
};
export const TextStateFeatureClient = createClientFeature(({
  props
}) => {
  const stateMap = registerTextStates(props.state);
  return {
    plugins: [{
      Component: () => StatePlugin({
        stateMap
      }),
      position: 'normal'
    }],
    toolbarFixed: {
      groups: toolbarGroups(props, stateMap)
    },
    toolbarInline: {
      groups: toolbarGroups(props, stateMap)
    }
  };
});
//# sourceMappingURL=feature.client.js.map