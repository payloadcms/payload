import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState';
import React from 'react';
import { getDocPreferences } from '../Document/getDocPreferences.js';
import { getDocumentData } from '../Document/getDocumentData.js';
import { CreateFirstUserClient } from './index.client.js';
export async function CreateFirstUserView({
  initPageResult
}) {
  const {
    locale,
    req,
    req: {
      payload: {
        collections,
        config: {
          admin: {
            user: userSlug
          }
        }
      }
    }
  } = initPageResult;
  const collectionConfig = collections?.[userSlug]?.config;
  const {
    auth: authOptions
  } = collectionConfig;
  const loginWithUsername = authOptions.loginWithUsername;
  // Fetch the data required for the view
  const data = await getDocumentData({
    collectionSlug: collectionConfig.slug,
    locale,
    payload: req.payload,
    req,
    user: req.user
  });
  // Get document preferences
  const docPreferences = await getDocPreferences({
    collectionSlug: collectionConfig.slug,
    payload: req.payload,
    user: req.user
  });
  const baseFields = Object.fromEntries(collectionConfig.fields.filter(f => 'name' in f && typeof f.name === 'string').map(f => [f.name, {
    create: true,
    read: true,
    update: true
  }]));
  // In create-first-user we should always allow all fields
  const docPermissionsForForm = {
    create: true,
    delete: true,
    fields: baseFields,
    read: true,
    readVersions: true,
    update: true
  };
  // Build initial form state from data
  const {
    state: formState
  } = await buildFormState({
    collectionSlug: collectionConfig.slug,
    data,
    docPermissions: docPermissionsForForm,
    docPreferences,
    locale: locale?.code,
    operation: 'create',
    renderAllFields: true,
    req,
    schemaPath: collectionConfig.slug,
    skipClientConfigAuth: true,
    skipValidation: true
  });
  return /*#__PURE__*/_jsxs("div", {
    className: "create-first-user",
    children: [/*#__PURE__*/_jsx("h1", {
      children: req.t('general:welcome')
    }), /*#__PURE__*/_jsx("p", {
      children: req.t('authentication:beginCreateFirstUser')
    }), /*#__PURE__*/_jsx(CreateFirstUserClient, {
      docPermissions: docPermissionsForForm,
      docPreferences: docPreferences,
      initialState: formState,
      loginWithUsername: loginWithUsername,
      userSlug: userSlug
    })]
  });
}
//# sourceMappingURL=index.js.map