import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHash } from 'crypto';
const baseClass = 'lexical-unknown-diff';
export const UnknownDiffHTMLConverterAsync = ({
  i18n,
  req
}) => {
  return {
    unknown: async ({
      node,
      providedCSSString
    }) => {
      const ReactDOMServer = (await import('react-dom/server')).default;
      // hash fields to ensure they are diffed if they change
      const nodeFieldsHash = createHash('sha256').update(JSON.stringify(node ?? {})).digest('hex');
      let nodeType = node.type;
      let nodeTypeSpecifier = null;
      if (node.type === 'block') {
        nodeTypeSpecifier = node.fields.blockType;
        nodeType = 'Block';
      } else if (node.type === 'inlineBlock') {
        nodeTypeSpecifier = node.fields.blockType;
        nodeType = 'InlineBlock';
      }
      const JSX = /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}${providedCSSString}`,
        "data-enable-match": "true",
        "data-fields-hash": `${nodeFieldsHash}`,
        children: [nodeTypeSpecifier && /*#__PURE__*/_jsxs("span", {
          className: `${baseClass}__specifier`,
          children: [nodeTypeSpecifier, " "]
        }), /*#__PURE__*/_jsx("span", {
          children: nodeType
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__meta`,
          children: /*#__PURE__*/_jsx("br", {})
        })]
      });
      // Render to HTML
      const html = ReactDOMServer.renderToStaticMarkup(JSX);
      return html;
    }
  };
};
//# sourceMappingURL=index.js.map