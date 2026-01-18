import { TextIcon } from '../../../lexical/ui/icons/Text/index.js';
export const toolbarTextDropdownGroupWithItems = items => {
  return {
    type: 'dropdown',
    ChildComponent: TextIcon,
    items,
    key: 'text',
    order: 25
  };
};
//# sourceMappingURL=textDropdownGroup.js.map