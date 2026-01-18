import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckIcon } from '@payloadcms/ui/rsc';
export const ListItemDiffHTMLConverterAsync = {
  listitem: async ({
    node,
    nodesToHTML,
    parent,
    providedCSSString
  }) => {
    const hasSubLists = node.children.some(child => child.type === 'list');
    const children = (await nodesToHTML({
      nodes: node.children
    })).join('');
    if ('listType' in parent && parent?.listType === 'check') {
      const ReactDOMServer = (await import('react-dom/server')).default;
      const JSX = /*#__PURE__*/_jsx("li", {
        "aria-checked": node.checked ? true : false,
        className: `checkboxItem ${node.checked ? 'checkboxItem--checked' : 'checkboxItem--unchecked'}${hasSubLists ? ' checkboxItem--nested' : ''}`,
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role: "checkbox",
        tabIndex: -1,
        value: node.value,
        children: hasSubLists ?
        // When sublists exist, just render them safely as HTML
        /*#__PURE__*/
        _jsx("div", {
          dangerouslySetInnerHTML: {
            __html: children
          }
        }) :
        // Otherwise, show our custom styled checkbox
        /*#__PURE__*/
        _jsxs("div", {
          className: "checkboxItem__wrapper",
          children: [/*#__PURE__*/_jsx("div", {
            className: "checkboxItem__icon",
            "data-checked": node.checked,
            "data-enable-match": "true",
            children: node.checked && /*#__PURE__*/_jsx(CheckIcon, {})
          }), /*#__PURE__*/_jsx("span", {
            className: "checkboxItem__label",
            children: children
          })]
        })
      });
      const html = ReactDOMServer.renderToStaticMarkup(JSX);
      // Add style="list-style-type: none;${providedCSSString}" to html
      const styleIndex = html.indexOf('class="list-item-checkbox');
      const classIndex = html.indexOf('class="list-item-checkbox', styleIndex);
      const classEndIndex = html.indexOf('"', classIndex + 6);
      const className = html.substring(classIndex, classEndIndex);
      const classNameWithStyle = `${className} style="list-style-type: none;${providedCSSString}"`;
      const htmlWithStyle = html.replace(className, classNameWithStyle);
      return htmlWithStyle;
    } else {
      return `<li
          class="${hasSubLists ? 'nestedListItem' : ''}"
          style="${hasSubLists ? `list-style-type: none;${providedCSSString}` : providedCSSString}"
          value="${node.value}"
          data-enable-match="true"
        >${children}</li>`;
    }
  }
};
//# sourceMappingURL=index.js.map