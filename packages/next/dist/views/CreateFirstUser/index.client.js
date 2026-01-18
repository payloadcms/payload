'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConfirmPasswordField, EmailAndUsernameFields, Form, FormSubmit, PasswordField, RenderFields, useAuth, useConfig, useServerFunctions, useTranslation } from '@payloadcms/ui';
import { abortAndIgnore, handleAbortRef } from '@payloadcms/ui/shared';
import { formatAdminURL } from 'payload/shared';
import React, { useEffect } from 'react';
export const CreateFirstUserClient = ({
  docPermissions,
  docPreferences,
  initialState,
  loginWithUsername,
  userSlug
}) => {
  const {
    config: {
      routes: {
        admin,
        api: apiRoute
      }
    },
    getEntityConfig
  } = useConfig();
  const {
    getFormState
  } = useServerFunctions();
  const {
    t
  } = useTranslation();
  const {
    setUser
  } = useAuth();
  const abortOnChangeRef = React.useRef(null);
  const collectionConfig = getEntityConfig({
    collectionSlug: userSlug
  });
  const onChange = React.useCallback(async ({
    formState: prevFormState,
    submitted
  }) => {
    const controller = handleAbortRef(abortOnChangeRef);
    const response = await getFormState({
      collectionSlug: userSlug,
      docPermissions,
      docPreferences,
      formState: prevFormState,
      operation: 'create',
      schemaPath: userSlug,
      signal: controller.signal,
      skipValidation: !submitted
    });
    abortOnChangeRef.current = null;
    if (response && response.state) {
      return response.state;
    }
  }, [userSlug, getFormState, docPermissions, docPreferences]);
  const handleFirstRegister = data => {
    setUser(data);
  };
  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current;
    return () => {
      abortAndIgnore(abortOnChange);
    };
  }, []);
  return /*#__PURE__*/_jsxs(Form, {
    action: formatAdminURL({
      apiRoute,
      path: `/${userSlug}/first-register`
    }),
    initialState: {
      ...initialState,
      'confirm-password': {
        ...initialState['confirm-password'],
        valid: initialState['confirm-password']['valid'] || false,
        value: initialState['confirm-password']['value'] || ''
      }
    },
    method: "POST",
    onChange: [onChange],
    onSuccess: handleFirstRegister,
    redirect: admin,
    validationOperation: "create",
    children: [/*#__PURE__*/_jsx(EmailAndUsernameFields, {
      className: "emailAndUsername",
      loginWithUsername: loginWithUsername,
      operation: "create",
      readOnly: false,
      t: t
    }), /*#__PURE__*/_jsx(PasswordField, {
      autoComplete: "off",
      field: {
        name: 'password',
        label: t('authentication:newPassword'),
        required: true
      },
      path: "password"
    }), /*#__PURE__*/_jsx(ConfirmPasswordField, {}), /*#__PURE__*/_jsx(RenderFields, {
      fields: collectionConfig.fields,
      forceRender: true,
      parentIndexPath: "",
      parentPath: "",
      parentSchemaPath: userSlug,
      permissions: true,
      readOnly: false
    }), /*#__PURE__*/_jsx(FormSubmit, {
      size: "large",
      children: t('general:create')
    })]
  });
};
//# sourceMappingURL=index.client.js.map