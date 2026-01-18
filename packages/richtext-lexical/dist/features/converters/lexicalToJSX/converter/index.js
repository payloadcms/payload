/* eslint-disable no-console */import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { hasText } from '../../../../validate/hasText.js';
export function convertLexicalToJSX({
  converters,
  data,
  disableIndent,
  disableTextAlign
}) {
  if (hasText(data)) {
    return convertLexicalNodesToJSX({
      converters,
      disableIndent,
      disableTextAlign,
      nodes: data?.root?.children,
      parent: data?.root
    });
  }
  return /*#__PURE__*/_jsx(_Fragment, {});
}
export function convertLexicalNodesToJSX({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent
}) {
  const unknownConverter = converters.unknown;
  const jsxArray = nodes.map((node, i) => {
    let converterForNode;
    if (node.type === 'block') {
      converterForNode = converters?.blocks?.[node?.fields?.blockType];
      if (!converterForNode && !unknownConverter) {
        console.error(`Lexical => JSX converter: Blocks converter: found ${node?.fields?.blockType} block, but no converter is provided`);
      }
    } else if (node.type === 'inlineBlock') {
      converterForNode = converters?.inlineBlocks?.[node?.fields?.blockType];
      if (!converterForNode && !unknownConverter) {
        console.error(`Lexical => JSX converter: Inline Blocks converter: found ${node?.fields?.blockType} inline block, but no converter is provided`);
      }
    } else {
      converterForNode = converters[node.type];
    }
    try {
      if (!converterForNode && unknownConverter) {
        converterForNode = unknownConverter;
      }
      let reactNode;
      if (converterForNode) {
        const converted = typeof converterForNode === 'function' ? converterForNode({
          childIndex: i,
          converters,
          node,
          nodesToJSX: args => {
            return convertLexicalNodesToJSX({
              converters: args.converters ?? converters,
              disableIndent: args.disableIndent ?? disableIndent,
              disableTextAlign: args.disableTextAlign ?? disableTextAlign,
              nodes: args.nodes,
              parent: args.parent ?? {
                ...node,
                parent
              }
            });
          },
          parent
        }) : converterForNode;
        reactNode = converted;
      } else {
        reactNode = /*#__PURE__*/_jsx("span", {
          children: "unknown node"
        }, i);
      }
      const style = {};
      // Check if disableTextAlign is not true and does not include node type
      if (!disableTextAlign && (!Array.isArray(disableTextAlign) || !disableTextAlign?.includes(node.type))) {
        if ('format' in node && node.format) {
          switch (node.format) {
            case 'center':
              style.textAlign = 'center';
              break;
            case 'end':
              style.textAlign = 'right';
              break;
            case 'justify':
              style.textAlign = 'justify';
              break;
            case 'left':
              break;
            case 'right':
              style.textAlign = 'right';
              break;
            case 'start':
              style.textAlign = 'left';
              break;
          }
        }
      }
      if (!disableIndent && (!Array.isArray(disableIndent) || !disableIndent?.includes(node.type))) {
        if ('indent' in node && node.indent && node.type !== 'listitem') {
          // the unit should be px. Do not change it to rem, em, or something else.
          // The quantity should be 40px. Do not change it either.
          // See rationale in
          // https://github.com/payloadcms/payload/issues/13130#issuecomment-3058348085
          style.paddingInlineStart = `${Number(node.indent) * 40}px`;
        }
      }
      if (/*#__PURE__*/React.isValidElement(reactNode)) {
        // Inject style into reactNode
        if (style.textAlign || style.paddingInlineStart) {
          const newStyle = {
            ...style,
            // @ts-expect-error type better later
            ...(reactNode?.props?.style ?? {})
          };
          return /*#__PURE__*/React.cloneElement(reactNode, {
            key: i,
            // @ts-expect-error type better later
            style: newStyle
          });
        }
        return /*#__PURE__*/React.cloneElement(reactNode, {
          key: i
        });
      }
      return reactNode;
    } catch (error) {
      console.error('Error converting lexical node to JSX:', error, 'node:', node);
      return null;
    }
  });
  return jsxArray.filter(Boolean);
}
//# sourceMappingURL=index.js.map