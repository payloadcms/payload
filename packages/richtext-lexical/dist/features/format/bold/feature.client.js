'use client';

import { $isTableSelection } from '@lexical/table';
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { BoldIcon } from '../../../lexical/ui/icons/Bold/index.js';
import { createClientFeature } from '../../../utilities/createClientFeature.js';
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js';
import { BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE, BOLD_STAR, BOLD_UNDERSCORE } from './markdownTransformers.js';
const toolbarGroups = [toolbarFormatGroupWithItems([{
  ChildComponent: BoldIcon,
  isActive: ({
    selection
  }) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      return selection.hasFormat('bold');
    }
    return false;
  },
  key: 'bold',
  onSelect: ({
    editor
  }) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  },
  order: 1
}])];
export const BoldFeatureClient = createClientFeature(({
  featureProviderMap
}) => {
  const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE];
  if (featureProviderMap.get('italic')) {
    markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR);
  }
  return {
    enableFormats: ['bold'],
    markdownTransformers,
    toolbarFixed: {
      groups: toolbarGroups
    },
    toolbarInline: {
      groups: toolbarGroups
    }
  };
});
//# sourceMappingURL=feature.client.js.map