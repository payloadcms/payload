import { jsx as _jsx } from "react/jsx-runtime";
import { getVisibleEntities } from '@payloadcms/ui/shared';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React from 'react';
import { DefaultTemplate } from '../../templates/Default/index.js';
import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js';
import { initReq } from '../../utilities/initReq.js';
import { NotFoundClient } from './index.client.js';
export const generateNotFoundViewMetadata = async ({
  config: configPromise
}) => {
  const config = await configPromise;
  const i18n = await getNextRequestI18n({
    config
  });
  return {
    title: i18n.t('general:notFound')
  };
};
export const NotFoundPage = async ({
  config: configPromise,
  importMap,
  params: paramsPromise,
  searchParams: searchParamsPromise
}) => {
  const config = await configPromise;
  const {
    routes: {
      admin: adminRoute
    } = {}
  } = config;
  const searchParams = await searchParamsPromise;
  const queryString = `${qs.stringify(searchParams ?? {}, {
    addQueryPrefix: true
  })}`;
  const {
    locale,
    permissions,
    req,
    req: {
      payload
    }
  } = await initReq({
    configPromise: config,
    importMap,
    key: 'RootLayout',
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true
        })
      },
      // intentionally omit `serverURL` to keep URL relative
      urlSuffix: `${formatAdminURL({
        adminRoute,
        path: '/not-found'
      })}${searchParams ? queryString : ''}`
    }
  });
  if (!req.user || !permissions.canAccessAdmin) {
    return /*#__PURE__*/_jsx(NotFoundClient, {});
  }
  const params = await paramsPromise;
  const visibleEntities = getVisibleEntities({
    req
  });
  return /*#__PURE__*/_jsx(DefaultTemplate, {
    i18n: req.i18n,
    locale: locale,
    params: params,
    payload: payload,
    permissions: permissions,
    searchParams: searchParams,
    user: req.user,
    visibleEntities: visibleEntities,
    children: /*#__PURE__*/_jsx(NotFoundClient, {})
  });
};
export function NotFoundView(props) {
  return /*#__PURE__*/_jsx(NotFoundClient, {
    marginTop: "large"
  });
}
//# sourceMappingURL=index.js.map