'use client';

import { $isTableSelection } from '@lexical/table';
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { SubscriptIcon } from '../../../lexical/ui/icons/Subscript/index.js';
import { createClientFeature } from '../../../utilities/createClientFeature.js';
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js';
const toolbarGroups = [toolbarFormatGroupWithItems([{
  ChildComponent: SubscriptIcon,
  isActive: ({
    selection
  }) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      return selection.hasFormat('subscript');
    }
    return false;
  },
  key: 'subscript',
  onSelect: ({
    editor
  }) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
  },
  order: 5
}])];
export const SubscriptFeatureClient = createClientFeature({
  enableFormats: ['subscript'],
  toolbarFixed: {
    groups: toolbarGroups
  },
  toolbarInline: {
    groups: toolbarGroups
  }
});
//# sourceMappingURL=feature.client.js.map