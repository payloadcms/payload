import { AddIcon } from '../../../lexical/ui/icons/Add/index.js';
export const toolbarAddDropdownGroupWithItems = items => {
  return {
    type: 'dropdown',
    ChildComponent: AddIcon,
    items,
    key: 'add',
    order: 10
  };
};
//# sourceMappingURL=addDropdownGroup.js.map