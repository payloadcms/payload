import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ActionsProvider, AppHeader, BulkUploadProvider, EntityVisibilityProvider, NavToggler } from '@payloadcms/ui';
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
import { DefaultNav } from '../../elements/Nav/index.js';
import { NavHamburger } from './NavHamburger/index.js';
import { Wrapper } from './Wrapper/index.js';
const baseClass = 'template-default';
export const DefaultTemplate = ({
  children,
  className,
  collectionSlug,
  docID,
  documentSubViewType,
  globalSlug,
  i18n,
  locale,
  params,
  payload,
  permissions,
  req,
  searchParams,
  user,
  viewActions,
  viewType,
  visibleEntities
}) => {
  const {
    admin: {
      avatar,
      components,
      components: {
        header: CustomHeader,
        Nav: CustomNav
      } = {
        header: undefined,
        Nav: undefined
      }
    } = {}
  } = payload.config || {};
  const clientProps = {
    documentSubViewType,
    viewType,
    visibleEntities
  };
  const serverProps = {
    collectionSlug,
    docID,
    globalSlug,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user
  };
  const Actions = {};
  for (const action of viewActions ?? []) {
    if (!action) {
      continue;
    }
    const key = typeof action === 'object' ? action.path : action;
    Actions[key] = RenderServerComponent({
      clientProps,
      Component: action,
      importMap: payload.importMap,
      serverProps
    });
  }
  const NavComponent = RenderServerComponent({
    clientProps,
    Component: CustomNav,
    Fallback: DefaultNav,
    importMap: payload.importMap,
    serverProps
  });
  return /*#__PURE__*/_jsx(EntityVisibilityProvider, {
    visibleEntities: visibleEntities,
    children: /*#__PURE__*/_jsx(BulkUploadProvider, {
      drawerSlugPrefix: collectionSlug,
      children: /*#__PURE__*/_jsxs(ActionsProvider, {
        Actions: Actions,
        children: [RenderServerComponent({
          clientProps,
          Component: CustomHeader,
          importMap: payload.importMap,
          serverProps
        }), /*#__PURE__*/_jsxs("div", {
          style: {
            position: 'relative'
          },
          children: [/*#__PURE__*/_jsx("div", {
            className: `${baseClass}__nav-toggler-wrapper`,
            id: "nav-toggler",
            children: /*#__PURE__*/_jsx("div", {
              className: `${baseClass}__nav-toggler-container`,
              id: "nav-toggler",
              children: /*#__PURE__*/_jsx(NavToggler, {
                className: `${baseClass}__nav-toggler`,
                children: /*#__PURE__*/_jsx(NavHamburger, {})
              })
            })
          }), /*#__PURE__*/_jsxs(Wrapper, {
            baseClass: baseClass,
            className: className,
            children: [NavComponent, /*#__PURE__*/_jsxs("div", {
              className: `${baseClass}__wrap`,
              children: [/*#__PURE__*/_jsx(AppHeader, {
                CustomAvatar: avatar !== 'gravatar' && avatar !== 'default' ? RenderServerComponent({
                  Component: avatar.Component,
                  importMap: payload.importMap,
                  serverProps
                }) : undefined,
                CustomIcon: components?.graphics?.Icon ? RenderServerComponent({
                  Component: components.graphics.Icon,
                  importMap: payload.importMap,
                  serverProps
                }) : undefined
              }), children]
            })]
          })]
        })]
      })
    })
  });
};
//# sourceMappingURL=index.js.map