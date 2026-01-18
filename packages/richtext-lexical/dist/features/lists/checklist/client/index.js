'use client';

import { $isListNode, INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list';
import { $isRangeSelection } from 'lexical';
import { ChecklistIcon } from '../../../../lexical/ui/icons/Checklist/index.js';
import { createClientFeature } from '../../../../utilities/createClientFeature.js';
import { toolbarTextDropdownGroupWithItems } from '../../../shared/toolbar/textDropdownGroup.js';
import { LexicalListPlugin } from '../../plugin/index.js';
import { shouldRegisterListBaseNodes } from '../../shared/shouldRegisterListBaseNodes.js';
import { slashMenuListGroupWithItems } from '../../shared/slashMenuListGroup.js';
import { CHECK_LIST } from '../markdownTransformers.js';
import { LexicalCheckListPlugin } from './plugin/index.js';
const toolbarGroups = [toolbarTextDropdownGroupWithItems([{
  ChildComponent: ChecklistIcon,
  isActive: ({
    selection
  }) => {
    if (!$isRangeSelection(selection)) {
      return false;
    }
    for (const node of selection.getNodes()) {
      if ($isListNode(node) && node.getListType() === 'check') {
        continue;
      }
      const parent = node.getParent();
      if ($isListNode(parent) && parent.getListType() === 'check') {
        continue;
      }
      const parentParent = parent?.getParent();
      // Example scenario: Node = textNode, parent = listItemNode, parentParent = listNode
      if ($isListNode(parentParent) && parentParent.getListType() === 'check') {
        continue;
      }
      return false;
    }
    return true;
  },
  key: 'checklist',
  label: ({
    i18n
  }) => {
    return i18n.t('lexical:checklist:label');
  },
  onSelect: ({
    editor
  }) => {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  },
  order: 12
}])];
export const ChecklistFeatureClient = createClientFeature(({
  featureProviderMap
}) => {
  const plugins = [{
    Component: LexicalCheckListPlugin,
    position: 'normal'
  }];
  const shouldRegister = shouldRegisterListBaseNodes('checklist', featureProviderMap);
  if (shouldRegister) {
    plugins.push({
      Component: LexicalListPlugin,
      position: 'normal'
    });
  }
  return {
    markdownTransformers: [CHECK_LIST],
    nodes: shouldRegister ? [ListNode, ListItemNode] : [],
    plugins,
    slashMenu: {
      groups: [slashMenuListGroupWithItems([{
        Icon: ChecklistIcon,
        key: 'checklist',
        keywords: ['check list', 'check', 'checklist', 'cl'],
        label: ({
          i18n
        }) => {
          return i18n.t('lexical:checklist:label');
        },
        onSelect: ({
          editor
        }) => {
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        }
      }])]
    },
    toolbarFixed: {
      groups: toolbarGroups
    },
    toolbarInline: {
      groups: toolbarGroups
    }
  };
});
//# sourceMappingURL=index.js.map