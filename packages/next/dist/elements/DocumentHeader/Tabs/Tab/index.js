import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import { Fragment } from 'react';
import { DocumentTabLink } from './TabLink.js';
export const baseClass = 'doc-tab';
export const DefaultDocumentTab = props => {
  const {
    apiURL,
    collectionConfig,
    globalConfig,
    permissions,
    req,
    tabConfig: {
      href: tabHref,
      isActive: tabIsActive,
      label,
      newTab,
      Pill,
      Pill_Component
    }
  } = props;
  let href = typeof tabHref === 'string' ? tabHref : '';
  let isActive = typeof tabIsActive === 'boolean' ? tabIsActive : false;
  if (typeof tabHref === 'function') {
    href = tabHref({
      apiURL,
      collection: collectionConfig,
      global: globalConfig,
      routes: req.payload.config.routes
    });
  }
  if (typeof tabIsActive === 'function') {
    isActive = tabIsActive({
      href
    });
  }
  const labelToRender = typeof label === 'function' ? label({
    t: req.i18n.t
  }) : label;
  return /*#__PURE__*/_jsx(DocumentTabLink, {
    adminRoute: req.payload.config.routes.admin,
    ariaLabel: labelToRender,
    baseClass: baseClass,
    href: href,
    isActive: isActive,
    newTab: newTab,
    children: /*#__PURE__*/_jsxs("span", {
      className: `${baseClass}__label`,
      children: [labelToRender, Pill || Pill_Component ? /*#__PURE__*/_jsxs(Fragment, {
        children: [" ", RenderServerComponent({
          Component: Pill,
          Fallback: Pill_Component,
          importMap: req.payload.importMap,
          serverProps: {
            i18n: req.i18n,
            payload: req.payload,
            permissions,
            req,
            user: req.user
          }
        })]
      }) : null]
    })
  });
};
//# sourceMappingURL=index.js.map