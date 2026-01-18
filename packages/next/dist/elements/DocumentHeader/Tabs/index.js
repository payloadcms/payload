import { jsx as _jsx } from "react/jsx-runtime";
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
import { ShouldRenderTabs } from './ShouldRenderTabs.js';
import { DefaultDocumentTab } from './Tab/index.js';
import { getTabs } from './tabs/index.js';
const baseClass = 'doc-tabs';
export const DocumentTabs = ({
  collectionConfig,
  globalConfig,
  permissions,
  req
}) => {
  const {
    config
  } = req.payload;
  const tabs = getTabs({
    collectionConfig,
    globalConfig
  });
  return /*#__PURE__*/_jsx(ShouldRenderTabs, {
    children: /*#__PURE__*/_jsx("div", {
      className: baseClass,
      children: /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__tabs-container`,
        children: /*#__PURE__*/_jsx("ul", {
          className: `${baseClass}__tabs`,
          children: tabs?.map(({
            tab: tabConfig,
            viewPath
          }, index) => {
            const {
              condition
            } = tabConfig || {};
            const meetsCondition = !condition || condition({
              collectionConfig,
              config,
              globalConfig,
              permissions,
              req
            });
            if (!meetsCondition) {
              return null;
            }
            if (tabConfig?.Component) {
              return RenderServerComponent({
                clientProps: {
                  path: viewPath
                },
                Component: tabConfig.Component,
                importMap: req.payload.importMap,
                key: `tab-${index}`,
                serverProps: {
                  collectionConfig,
                  globalConfig,
                  i18n: req.i18n,
                  payload: req.payload,
                  permissions,
                  req,
                  user: req.user
                }
              });
            }
            return /*#__PURE__*/_jsx(DefaultDocumentTab, {
              collectionConfig: collectionConfig,
              globalConfig: globalConfig,
              path: viewPath,
              permissions: permissions,
              req: req,
              tabConfig: tabConfig
            }, `tab-${index}`);
          })
        })
      })
    })
  });
};
//# sourceMappingURL=index.js.map