import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Logout } from '@payloadcms/ui';
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import { EntityType, groupNavItems } from '@payloadcms/ui/shared';
import React from 'react';
import { NavHamburger } from './NavHamburger/index.js';
import { NavWrapper } from './NavWrapper/index.js';
import { SettingsMenuButton } from './SettingsMenuButton/index.js';
const baseClass = 'nav';
import { getNavPrefs } from './getNavPrefs.js';
import { DefaultNavClient } from './index.client.js';
export const DefaultNav = async props => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities
  } = props;
  if (!payload?.config) {
    return null;
  }
  const {
    admin: {
      components: {
        afterNavLinks,
        beforeNavLinks,
        logout,
        settingsMenu
      }
    },
    collections,
    globals
  } = payload.config;
  const groups = groupNavItems([...collections.filter(({
    slug
  }) => visibleEntities.collections.includes(slug)).map(collection => ({
    type: EntityType.collection,
    entity: collection
  })), ...globals.filter(({
    slug
  }) => visibleEntities.globals.includes(slug)).map(global => ({
    type: EntityType.global,
    entity: global
  }))], permissions, i18n);
  const navPreferences = await getNavPrefs(req);
  const LogoutComponent = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType
    },
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user
    }
  });
  const renderedSettingsMenu = settingsMenu && Array.isArray(settingsMenu) ? settingsMenu.map((item, index) => RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType
    },
    Component: item,
    importMap: payload.importMap,
    key: `settings-menu-item-${index}`,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user
    }
  })) : [];
  return /*#__PURE__*/_jsxs(NavWrapper, {
    baseClass: baseClass,
    children: [/*#__PURE__*/_jsxs("nav", {
      className: `${baseClass}__wrap`,
      children: [RenderServerComponent({
        clientProps: {
          documentSubViewType,
          viewType
        },
        Component: beforeNavLinks,
        importMap: payload.importMap,
        serverProps: {
          i18n,
          locale,
          params,
          payload,
          permissions,
          searchParams,
          user
        }
      }), /*#__PURE__*/_jsx(DefaultNavClient, {
        groups: groups,
        navPreferences: navPreferences
      }), RenderServerComponent({
        clientProps: {
          documentSubViewType,
          viewType
        },
        Component: afterNavLinks,
        importMap: payload.importMap,
        serverProps: {
          i18n,
          locale,
          params,
          payload,
          permissions,
          searchParams,
          user
        }
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__controls`,
        children: [/*#__PURE__*/_jsx(SettingsMenuButton, {
          settingsMenu: renderedSettingsMenu
        }), LogoutComponent]
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__header`,
      children: /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__header-content`,
        children: /*#__PURE__*/_jsx(NavHamburger, {
          baseClass: baseClass
        })
      })
    })]
  });
};
//# sourceMappingURL=index.js.map