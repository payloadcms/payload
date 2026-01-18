import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { GridViewIcon } from '../../../icons/GridView/index.js';
import { ListViewIcon } from '../../../icons/ListView/index.js';
import { Button } from '../../Button/index.js';
import './index.scss';
const baseClass = 'folder-view-toggle-button';
export function ToggleViewButtons({
  activeView,
  setActiveView
}) {
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(Button, {
      buttonStyle: "pill",
      className: [baseClass, activeView === 'grid' && `${baseClass}--active`].filter(Boolean).join(' '),
      icon: /*#__PURE__*/_jsx(GridViewIcon, {}),
      margin: false,
      onClick: () => {
        setActiveView('grid');
      }
    }), /*#__PURE__*/_jsx(Button, {
      buttonStyle: "pill",
      className: [baseClass, activeView === 'list' && `${baseClass}--active`].filter(Boolean).join(' '),
      icon: /*#__PURE__*/_jsx(ListViewIcon, {}),
      margin: false,
      onClick: () => {
        setActiveView('list');
      }
    })]
  });
}
//# sourceMappingURL=index.js.map