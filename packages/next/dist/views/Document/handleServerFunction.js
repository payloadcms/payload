import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig';
import { headers as getHeaders } from 'next/headers.js';
import { canAccessAdmin, getAccessResults, isEntityHidden, parseCookies } from 'payload';
import { applyLocaleFiltering } from 'payload/shared';
import { renderDocument } from './index.js';
export const renderDocumentHandler = async args => {
  const {
    collectionSlug,
    disableActions,
    docID,
    drawerSlug,
    initialData,
    locale,
    overrideEntityVisibility,
    paramsOverride,
    redirectAfterCreate,
    redirectAfterDelete,
    redirectAfterDuplicate,
    req,
    req: {
      i18n,
      payload,
      payload: {
        config
      },
      user
    },
    searchParams = {},
    versions
  } = args;
  const headers = await getHeaders();
  const cookies = parseCookies(headers);
  await canAccessAdmin({
    req
  });
  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: req.payload.importMap,
    user
  });
  await applyLocaleFiltering({
    clientConfig,
    config,
    req
  });
  let preferences;
  if (docID) {
    const preferencesKey = `${collectionSlug}-edit-${docID}`;
    preferences = await payload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      where: {
        and: [{
          key: {
            equals: preferencesKey
          }
        }, {
          'user.relationTo': {
            equals: user.collection
          }
        }, {
          'user.value': {
            equals: user.id
          }
        }]
      }
    }).then(res => res.docs[0]?.value);
  }
  const visibleEntities = {
    collections: payload.config.collections.map(({
      slug,
      admin: {
        hidden
      }
    }) => !isEntityHidden({
      hidden,
      user
    }) ? slug : null).filter(Boolean),
    globals: payload.config.globals.map(({
      slug,
      admin: {
        hidden
      }
    }) => !isEntityHidden({
      hidden,
      user
    }) ? slug : null).filter(Boolean)
  };
  const permissions = await getAccessResults({
    req
  });
  const {
    data,
    Document
  } = await renderDocument({
    clientConfig,
    disableActions,
    documentSubViewType: 'default',
    drawerSlug,
    i18n,
    importMap: payload.importMap,
    initialData,
    initPageResult: {
      collectionConfig: payload?.collections?.[collectionSlug]?.config,
      cookies,
      docID,
      globalConfig: payload.config.globals.find(global => global.slug === collectionSlug),
      languageOptions: undefined,
      locale,
      permissions,
      req,
      translations: undefined,
      visibleEntities
    },
    overrideEntityVisibility,
    params: paramsOverride ?? {
      segments: ['collections', collectionSlug, String(docID)]
    },
    payload,
    redirectAfterCreate,
    redirectAfterDelete,
    redirectAfterDuplicate,
    searchParams,
    versions,
    viewType: 'document'
  });
  return {
    data,
    Document,
    preferences
  };
};
//# sourceMappingURL=handleServerFunction.js.map