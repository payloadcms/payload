import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { Link } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
function recurseEditorState(editorState, textContent, i = 0) {
  for (const node of editorState) {
    i++;
    if ('text' in node && node.text) {
      textContent.push(node.text);
    } else {
      if (!('children' in node)) {
        textContent.push(/*#__PURE__*/_jsxs("code", {
          children: [" [", node.type, "]"]
        }, i));
      }
    }
    if ('children' in node && node.children) {
      textContent = recurseEditorState(node.children, textContent, i);
    }
  }
  return textContent;
}
export const RscEntryLexicalCell = props => {
  const {
    cellData,
    className: classNameFromProps,
    collectionConfig,
    field: {
      admin
    },
    field,
    i18n,
    link,
    onClick: onClickFromProps,
    payload,
    rowData
  } = props;
  const classNameFromConfigContext = admin && 'className' in admin ? admin.className : undefined;
  const className = classNameFromProps || (field.admin && 'className' in field.admin ? field.admin.className : null) || classNameFromConfigContext;
  const adminRoute = payload.config.routes.admin;
  const serverURL = payload.config.serverURL;
  const onClick = onClickFromProps;
  let WrapElement = 'span';
  const wrapElementProps = {
    className
  };
  if (link) {
    wrapElementProps.prefetch = false;
    WrapElement = Link;
    wrapElementProps.href = collectionConfig?.slug ? formatAdminURL({
      adminRoute,
      path: `/collections/${collectionConfig?.slug}/${rowData.id}`,
      serverURL
    }) : '';
  }
  if (typeof onClick === 'function') {
    WrapElement = 'button';
    wrapElementProps.type = 'button';
    wrapElementProps.onClick = () => {
      onClick({
        cellData,
        collectionSlug: collectionConfig?.slug,
        rowData
      });
    };
  }
  let textContent = [];
  if (cellData?.root?.children) {
    textContent = recurseEditorState(cellData?.root?.children, textContent);
  }
  if (!textContent?.length) {
    textContent = [i18n.t('general:noLabel', {
      label: getTranslation(('label' in field ? field.label : null) || 'data', i18n)
    })];
  }
  return /*#__PURE__*/_jsx(WrapElement, {
    ...wrapElementProps,
    children: textContent
  });
};
//# sourceMappingURL=rscEntry.js.map