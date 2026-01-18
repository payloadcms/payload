import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { v4 as uuidv4 } from 'uuid';
export const ListJSXConverter = {
  list: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    const NodeTag = node.tag;
    return /*#__PURE__*/_jsx(NodeTag, {
      className: `list-${node?.listType}`,
      children: children
    });
  },
  listitem: ({
    node,
    nodesToJSX,
    parent
  }) => {
    const hasSubLists = node.children.some(child => child.type === 'list');
    const children = nodesToJSX({
      nodes: node.children
    });
    if ('listType' in parent && parent?.listType === 'check') {
      const uuid = uuidv4();
      return /*#__PURE__*/_jsx("li", {
        "aria-checked": node.checked ? 'true' : 'false',
        className: `list-item-checkbox${node.checked ? ' list-item-checkbox-checked' : ' list-item-checkbox-unchecked'}${hasSubLists ? ' nestedListItem' : ''}`,
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role: "checkbox",
        style: {
          listStyleType: 'none'
        },
        tabIndex: -1,
        value: node?.value,
        children: hasSubLists ? children : /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx("input", {
            checked: node.checked,
            id: uuid,
            readOnly: true,
            type: "checkbox"
          }), /*#__PURE__*/_jsx("label", {
            htmlFor: uuid,
            children: children
          }), /*#__PURE__*/_jsx("br", {})]
        })
      });
    } else {
      return /*#__PURE__*/_jsx("li", {
        className: `${hasSubLists ? 'nestedListItem' : ''}`,
        style: hasSubLists ? {
          listStyleType: 'none'
        } : undefined,
        value: node?.value,
        children: children
      });
    }
  }
};
//# sourceMappingURL=list.js.map