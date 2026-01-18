'use client';

import { AlignLeftIcon } from '../../../lexical/ui/icons/AlignLeft/index.js';
export const toolbarAlignGroupWithItems = items => {
  return {
    type: 'dropdown',
    ChildComponent: AlignLeftIcon,
    items,
    key: 'align',
    order: 30
  };
};
//# sourceMappingURL=toolbarAlignGroup.js.map