'use client';

import { $findMatchingParent } from '@lexical/utils';
import { $isElementNode, INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical';
import { IndentDecreaseIcon } from '../../../lexical/ui/icons/IndentDecrease/index.js';
import { IndentIncreaseIcon } from '../../../lexical/ui/icons/IndentIncrease/index.js';
import { createClientFeature } from '../../../utilities/createClientFeature.js';
import { IndentPlugin } from './IndentPlugin.js';
import { toolbarIndentGroupWithItems } from './toolbarIndentGroup.js';
const toolbarGroups = ({
  disabledNodes
}) => [toolbarIndentGroupWithItems([{
  ChildComponent: IndentDecreaseIcon,
  isActive: () => false,
  isEnabled: ({
    selection
  }) => {
    const nodes = selection?.getNodes() ?? [];
    const isOutdentable = node => {
      return isIndentable(node) && node.getIndent() > 0;
    };
    return nodes.some(node => {
      return isOutdentable(node) || Boolean($findMatchingParent(node, isOutdentable));
    });
  },
  key: 'indentDecrease',
  label: ({
    i18n
  }) => {
    return i18n.t('lexical:indent:decreaseLabel');
  },
  onSelect: ({
    editor
  }) => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
  },
  order: 1
}, {
  ChildComponent: IndentIncreaseIcon,
  isActive: () => false,
  isEnabled: ({
    selection
  }) => {
    const nodes = selection?.getNodes() ?? [];
    const isIndentableAndNotDisabled = node => {
      return isIndentable(node) && !(disabledNodes ?? []).includes(node.getType());
    };
    return nodes.some(node => {
      return isIndentableAndNotDisabled(node) || Boolean($findMatchingParent(node, isIndentableAndNotDisabled));
    });
  },
  key: 'indentIncrease',
  label: ({
    i18n
  }) => {
    return i18n.t('lexical:indent:increaseLabel');
  },
  onSelect: ({
    editor
  }) => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
  },
  order: 2
}])];
export const IndentFeatureClient = createClientFeature(({
  props
}) => {
  const disabledNodes = props.disabledNodes ?? [];
  return {
    plugins: [{
      Component: IndentPlugin,
      position: 'normal'
    }],
    sanitizedClientFeatureProps: props,
    toolbarFixed: {
      groups: toolbarGroups({
        disabledNodes
      })
    },
    toolbarInline: {
      groups: toolbarGroups({
        disabledNodes
      })
    }
  };
});
const isIndentable = node => $isElementNode(node) && node.canIndent();
//# sourceMappingURL=index.js.map