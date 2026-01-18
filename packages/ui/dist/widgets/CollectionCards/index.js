import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { EntityType, getAccessResults } from 'payload';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
import { Button } from '../../elements/Button/index.js';
import { Card } from '../../elements/Card/index.js';
import { Locked } from '../../elements/Locked/index.js';
import { getGlobalData } from '../../utilities/getGlobalData.js';
import { getNavGroups } from '../../utilities/getNavGroups.js';
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js';
import './index.scss';
const baseClass = 'collections';
export async function CollectionCards(props) {
  const {
    i18n,
    payload,
    user
  } = props.req;
  const {
    admin: adminRoute
  } = payload.config.routes;
  const {
    t
  } = i18n;
  const permissions = await getAccessResults({
    req: props.req
  });
  const visibleEntities = getVisibleEntities({
    req: props.req
  });
  const globalData = await getGlobalData(props.req);
  const navGroups = getNavGroups(permissions, visibleEntities, payload.config, i18n);
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__wrap`,
      children: !navGroups || navGroups?.length === 0 ? /*#__PURE__*/_jsx("p", {
        children: "no nav groups...."
      }) : navGroups.map(({
        entities,
        label
      }, groupIndex) => {
        return /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__group`,
          children: [/*#__PURE__*/_jsx("h2", {
            className: `${baseClass}__label`,
            children: label
          }), /*#__PURE__*/_jsx("ul", {
            className: `${baseClass}__card-list`,
            children: entities.map(({
              slug,
              type,
              label
            }, entityIndex) => {
              let title;
              let buttonAriaLabel;
              let createHREF;
              let href;
              let hasCreatePermission;
              let isLocked = null;
              let userEditing = null;
              // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
              if (type === EntityType.collection) {
                title = getTranslation(label, i18n);
                buttonAriaLabel = t('general:showAllLabel', {
                  label: title
                });
                href = formatAdminURL({
                  adminRoute,
                  path: `/collections/${slug}`
                });
                createHREF = formatAdminURL({
                  adminRoute,
                  path: `/collections/${slug}/create`
                });
                hasCreatePermission = permissions?.collections?.[slug]?.create;
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
              if (type === EntityType.global) {
                title = getTranslation(label, i18n);
                buttonAriaLabel = t('general:editLabel', {
                  label: getTranslation(label, i18n)
                });
                href = formatAdminURL({
                  adminRoute,
                  path: `/globals/${slug}`
                });
                // Find the lock status for the global
                const globalLockData = globalData.find(global => global.slug === slug);
                if (globalLockData) {
                  isLocked = globalLockData.data._isLocked;
                  userEditing = globalLockData.data._userEditing;
                  // Check if the lock is expired
                  const lockDuration = globalLockData?.lockDuration;
                  const lastEditedAt = new Date(globalLockData.data?._lastEditedAt).getTime();
                  const lockDurationInMilliseconds = lockDuration * 1000;
                  const lockExpirationTime = lastEditedAt + lockDurationInMilliseconds;
                  if (new Date().getTime() > lockExpirationTime) {
                    isLocked = false;
                    userEditing = null;
                  }
                }
              }
              return /*#__PURE__*/_jsx("li", {
                children: /*#__PURE__*/_jsx(Card, {
                  actions: isLocked && user?.id !== userEditing?.id ? /*#__PURE__*/_jsx(Locked, {
                    className: `${baseClass}__locked`,
                    user: userEditing
                  }) : hasCreatePermission && type === EntityType.collection ? /*#__PURE__*/_jsx(Button, {
                    "aria-label": t('general:createNewLabel', {
                      label
                    }),
                    buttonStyle: "icon-label",
                    el: "link",
                    icon: "plus",
                    iconStyle: "with-border",
                    round: true,
                    to: createHREF
                  }) : undefined,
                  buttonAriaLabel: buttonAriaLabel,
                  href: href,
                  id: `card-${slug}`,
                  title: getTranslation(label, i18n),
                  titleAs: "h3"
                })
              }, entityIndex);
            })
          })]
        }, groupIndex);
      })
    })
  });
}
//# sourceMappingURL=index.js.map