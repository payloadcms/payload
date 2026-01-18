'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatAdminURL, getFieldPermissions } from 'payload/shared';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../elements/Button/index.js';
import { EmailAndUsernameFields } from '../../../elements/EmailAndUsername/index.js';
import { CheckboxField } from '../../../fields/Checkbox/index.js';
import { ConfirmPasswordField } from '../../../fields/ConfirmPassword/index.js';
import { PasswordField } from '../../../fields/Password/index.js';
import { useFormFields, useFormModified } from '../../../forms/Form/context.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
import { APIKey } from './APIKey.js';
const baseClass = 'auth-fields';
export const Auth = props => {
  const $ = _c(21);
  const {
    className,
    collectionSlug,
    disableLocalStrategy,
    email,
    loginWithUsername,
    operation,
    readOnly,
    requirePassword,
    setValidateBeforeSubmit,
    useAPIKey,
    username,
    verify
  } = props;
  const [changingPassword, setChangingPassword] = useState(requirePassword);
  const enableAPIKey = useFormFields(_temp);
  const dispatchFields = useFormFields(_temp2);
  const modified = useFormModified();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    docPermissions,
    isEditing,
    isInitializing,
    isTrashed
  } = useDocumentInfo();
  const {
    config: t0
  } = useConfig();
  const {
    routes: t1
  } = t0;
  const {
    api
  } = t1;
  let showPasswordFields = true;
  let showUnlock = true;
  const hasPasswordFieldOverride = typeof docPermissions.fields === "object" && "password" in docPermissions.fields;
  const hasLoginFieldOverride = typeof docPermissions.fields === "object" && ("username" in docPermissions.fields || "email" in docPermissions.fields);
  if (hasPasswordFieldOverride) {
    const {
      permissions: passwordPermissions
    } = getFieldPermissions({
      field: {
        name: "password",
        type: "text"
      },
      operation,
      parentName: "",
      permissions: docPermissions?.fields
    });
    if (operation === "create") {
      showPasswordFields = passwordPermissions === true || typeof passwordPermissions === "object" && passwordPermissions.create;
    } else {
      showPasswordFields = passwordPermissions === true || typeof passwordPermissions === "object" && passwordPermissions.update;
    }
  }
  if (hasLoginFieldOverride) {
    const hasEmailAndUsernameFields = loginWithUsername && (loginWithUsername.requireEmail || loginWithUsername.allowEmailLogin);
    let t2;
    if ($[0] !== docPermissions.fields) {
      t2 = getFieldPermissions({
        field: {
          name: "email",
          type: "text"
        },
        operation: "read",
        parentName: "",
        permissions: docPermissions?.fields
      });
      $[0] = docPermissions.fields;
      $[1] = t2;
    } else {
      t2 = $[1];
    }
    const {
      operation: emailPermission
    } = t2;
    let t3;
    if ($[2] !== docPermissions.fields) {
      t3 = getFieldPermissions({
        field: {
          name: "username",
          type: "text"
        },
        operation: "read",
        parentName: "",
        permissions: docPermissions?.fields
      });
      $[2] = docPermissions.fields;
      $[3] = t3;
    } else {
      t3 = $[3];
    }
    const {
      operation: usernamePermission
    } = t3;
    if (hasEmailAndUsernameFields) {
      showUnlock = usernamePermission || emailPermission;
    } else {
      if (loginWithUsername && !hasEmailAndUsernameFields) {
        showUnlock = usernamePermission;
      } else {
        showUnlock = emailPermission;
      }
    }
  }
  const enableFields = (!disableLocalStrategy || typeof disableLocalStrategy === "object" && disableLocalStrategy.enableFields === true) && (showUnlock || showPasswordFields);
  const disabled = readOnly || isInitializing || isTrashed;
  const apiKeyPermissions = docPermissions?.fields === true ? true : docPermissions?.fields?.enableAPIKey;
  const apiKeyReadOnly = readOnly || apiKeyPermissions === true || apiKeyPermissions && typeof apiKeyPermissions === "object" && !apiKeyPermissions?.update;
  const enableAPIKeyReadOnly = readOnly || apiKeyPermissions !== true && !apiKeyPermissions?.update;
  const canReadApiKey = apiKeyPermissions === true || apiKeyPermissions?.read;
  let t2;
  bb0: {
    if (docPermissions) {
      t2 = Boolean("unlock" in docPermissions ? docPermissions.unlock : undefined);
      break bb0;
    }
    t2 = false;
  }
  const hasPermissionToUnlock = t2;
  let t3;
  if ($[4] !== dispatchFields || $[5] !== setValidateBeforeSubmit || $[6] !== t) {
    t3 = changingPassword_0 => {
      if (changingPassword_0) {
        setValidateBeforeSubmit(true);
        dispatchFields({
          type: "UPDATE",
          errorMessage: t("validation:required"),
          path: "password",
          valid: false
        });
        dispatchFields({
          type: "UPDATE",
          errorMessage: t("validation:required"),
          path: "confirm-password",
          valid: false
        });
      } else {
        setValidateBeforeSubmit(false);
        dispatchFields({
          type: "REMOVE",
          path: "password"
        });
        dispatchFields({
          type: "REMOVE",
          path: "confirm-password"
        });
      }
      setChangingPassword(changingPassword_0);
    };
    $[4] = dispatchFields;
    $[5] = setValidateBeforeSubmit;
    $[6] = t;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const handleChangePassword = t3;
  let t4;
  if ($[8] !== api || $[9] !== collectionSlug || $[10] !== email || $[11] !== i18n || $[12] !== loginWithUsername || $[13] !== t || $[14] !== username) {
    t4 = async () => {
      const url = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}/unlock`
      });
      const response = await fetch(url, {
        body: loginWithUsername && username ? JSON.stringify({
          username
        }) : JSON.stringify({
          email
        }),
        credentials: "include",
        headers: {
          "Accept-Language": i18n.language,
          "Content-Type": "application/json"
        },
        method: "post"
      });
      if (response.status === 200) {
        toast.success(t("authentication:successfullyUnlocked"));
      } else {
        toast.error(t("authentication:failedToUnlock"));
      }
    };
    $[8] = api;
    $[9] = collectionSlug;
    $[10] = email;
    $[11] = i18n;
    $[12] = loginWithUsername;
    $[13] = t;
    $[14] = username;
    $[15] = t4;
  } else {
    t4 = $[15];
  }
  const unlock = t4;
  let t5;
  let t6;
  if ($[16] !== modified) {
    t5 = () => {
      if (!modified) {
        setChangingPassword(false);
      }
    };
    t6 = [modified];
    $[16] = modified;
    $[17] = t5;
    $[18] = t6;
  } else {
    t5 = $[17];
    t6 = $[18];
  }
  useEffect(t5, t6);
  const showAuthBlock = enableFields;
  const showAPIKeyBlock = useAPIKey && canReadApiKey;
  const showVerifyBlock = verify && isEditing;
  if (!(showAuthBlock || showAPIKeyBlock || showVerifyBlock)) {
    return null;
  }
  let t7;
  if ($[19] !== className) {
    t7 = [baseClass, className].filter(Boolean);
    $[19] = className;
    $[20] = t7;
  } else {
    t7 = $[20];
  }
  return _jsxs("div", {
    className: t7.join(" "),
    children: [enableFields && _jsxs(React.Fragment, {
      children: [_jsx(EmailAndUsernameFields, {
        loginWithUsername,
        operation,
        permissions: docPermissions?.fields,
        readOnly: readOnly || isTrashed,
        t
      }), (changingPassword || requirePassword) && (!disableLocalStrategy || !enableFields) && _jsxs("div", {
        className: `${baseClass}__changing-password`,
        children: [_jsx(PasswordField, {
          autoComplete: "new-password",
          field: {
            name: "password",
            label: t("authentication:newPassword"),
            required: true
          },
          indexPath: "",
          parentPath: "",
          parentSchemaPath: "",
          path: "password",
          schemaPath: "password"
        }), _jsx(ConfirmPasswordField, {
          disabled: readOnly || isTrashed
        })]
      }), _jsxs("div", {
        className: `${baseClass}__controls`,
        children: [changingPassword && !requirePassword && _jsx(Button, {
          buttonStyle: "secondary",
          disabled,
          id: "cancel-change-password",
          onClick: () => handleChangePassword(false),
          size: "medium",
          children: t("general:cancel")
        }), !changingPassword && !requirePassword && !disableLocalStrategy && showPasswordFields && _jsx(Button, {
          buttonStyle: "secondary",
          disabled,
          id: "change-password",
          onClick: () => handleChangePassword(true),
          size: "medium",
          children: t("authentication:changePassword")
        }), !changingPassword && operation === "update" && hasPermissionToUnlock && _jsx(Button, {
          buttonStyle: "secondary",
          disabled: disabled || !showUnlock,
          id: "force-unlock",
          onClick: () => void unlock(),
          size: "medium",
          children: t("authentication:forceUnlock")
        })]
      })]
    }), useAPIKey && _jsx("div", {
      className: `${baseClass}__api-key`,
      children: canReadApiKey && _jsxs(Fragment, {
        children: [_jsx(CheckboxField, {
          field: {
            name: "enableAPIKey",
            admin: {
              disabled,
              readOnly: enableAPIKeyReadOnly
            },
            label: t("authentication:enableAPIKey")
          },
          path: "enableAPIKey",
          schemaPath: `${collectionSlug}.enableAPIKey`
        }), _jsx(APIKey, {
          enabled: !!enableAPIKey?.value,
          readOnly: apiKeyReadOnly
        })]
      })
    }), verify && isEditing && _jsx(CheckboxField, {
      field: {
        name: "_verified",
        admin: {
          disabled,
          readOnly
        },
        label: t("authentication:verified")
      },
      path: "_verified",
      schemaPath: `${collectionSlug}._verified`
    })]
  });
};
function _temp(t0) {
  const [fields] = t0;
  return fields && fields?.enableAPIKey || null;
}
function _temp2(reducer) {
  return reducer[1];
}
//# sourceMappingURL=index.js.map