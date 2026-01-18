'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { useRouter, useSearchParams } from 'next/navigation.js';
import { combineWhereConstraints, formatAdminURL, mergeListSearchAndWhere, unflatten } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from '../../forms/Form/context.js';
import { Form } from '../../forms/Form/index.js';
import { RenderField } from '../../forms/RenderFields/RenderField.js';
import { FormSubmit } from '../../forms/Submit/index.js';
import { XIcon } from '../../icons/X/index.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { OperationContext } from '../../providers/Operation/index.js';
import { useRouteCache } from '../../providers/RouteCache/index.js';
import { useServerFunctions } from '../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js';
import { parseSearchParams } from '../../utilities/parseSearchParams.js';
import { FieldSelect } from '../FieldSelect/index.js';
import './index.scss';
import '../../forms/RenderFields/index.scss';
import { baseClass } from './index.js';
const Submit = t0 => {
  const $ = _c(7);
  const {
    action,
    disabled
  } = t0;
  const {
    submit
  } = useForm();
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== action || $[1] !== submit) {
    t1 = () => {
      submit({
        action,
        method: "PATCH",
        skipValidation: true
      });
    };
    $[0] = action;
    $[1] = submit;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const save = t1;
  let t2;
  if ($[3] !== disabled || $[4] !== save || $[5] !== t) {
    t2 = _jsx(FormSubmit, {
      className: `${baseClass}__save`,
      disabled,
      onClick: save,
      children: t("general:save")
    });
    $[3] = disabled;
    $[4] = save;
    $[5] = t;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
};
const PublishButton = t0 => {
  const $ = _c(7);
  const {
    action,
    disabled
  } = t0;
  const {
    submit
  } = useForm();
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== action || $[1] !== submit) {
    t1 = () => {
      submit({
        action,
        method: "PATCH",
        overrides: {
          _status: "published"
        },
        skipValidation: true
      });
    };
    $[0] = action;
    $[1] = submit;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const save = t1;
  let t2;
  if ($[3] !== disabled || $[4] !== save || $[5] !== t) {
    t2 = _jsx(FormSubmit, {
      className: `${baseClass}__publish`,
      disabled,
      onClick: save,
      children: t("version:publishChanges")
    });
    $[3] = disabled;
    $[4] = save;
    $[5] = t;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
};
const SaveDraftButton = t0 => {
  const $ = _c(7);
  const {
    action,
    disabled
  } = t0;
  const {
    submit
  } = useForm();
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== action || $[1] !== submit) {
    t1 = () => {
      submit({
        action,
        method: "PATCH",
        overrides: {
          _status: "draft"
        },
        skipValidation: true
      });
    };
    $[0] = action;
    $[1] = submit;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const save = t1;
  let t2;
  if ($[3] !== disabled || $[4] !== save || $[5] !== t) {
    t2 = _jsx(FormSubmit, {
      buttonStyle: "secondary",
      className: `${baseClass}__draft`,
      disabled,
      onClick: save,
      children: t("version:saveDraft")
    });
    $[3] = disabled;
    $[4] = save;
    $[5] = t;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
};
export const EditManyDrawerContent = props => {
  const {
    collection,
    collection: {
      fields,
      labels: {
        plural,
        singular
      }
    } = {},
    count,
    drawerSlug,
    ids,
    onSuccess: onSuccessFromProps,
    selectAll,
    selectedFields,
    setSelectedFields,
    where
  } = props;
  const {
    permissions,
    user
  } = useAuth();
  const {
    code: locale
  } = useLocale();
  const {
    closeModal
  } = useModal();
  const {
    config: {
      routes: {
        api: apiRoute
      }
    }
  } = useConfig();
  const {
    getFormState
  } = useServerFunctions();
  const {
    i18n,
    t
  } = useTranslation();
  const [isInitializing, setIsInitializing] = useState(false);
  const router = useRouter();
  const abortFormStateRef = React.useRef(null);
  const {
    clearRouteCache
  } = useRouteCache();
  const collectionPermissions = permissions?.collections?.[collection.slug];
  const searchParams = useSearchParams();
  const select = useMemo(() => {
    return unflatten(selectedFields.reduce((acc, option) => {
      acc[option.value.path] = true;
      return acc;
    }, {}));
  }, [selectedFields]);
  const onChange = useCallback(async ({
    formState: prevFormState,
    submitted
  }) => {
    const controller = handleAbortRef(abortFormStateRef);
    const {
      state
    } = await getFormState({
      collectionSlug: collection.slug,
      docPermissions: collectionPermissions,
      docPreferences: null,
      formState: prevFormState,
      operation: 'update',
      schemaPath: collection.slug,
      select,
      signal: controller.signal,
      skipValidation: !submitted
    });
    abortFormStateRef.current = null;
    return state;
  }, [getFormState, collection, collectionPermissions, select]);
  useEffect(() => {
    const abortFormState = abortFormStateRef.current;
    return () => {
      abortAndIgnore(abortFormState);
    };
  }, []);
  const queryString = useMemo(() => {
    const whereConstraints = [];
    if (where) {
      whereConstraints.push(where);
    }
    const queryWithSearch = mergeListSearchAndWhere({
      collectionConfig: collection,
      search: searchParams.get('search')
    });
    if (queryWithSearch) {
      whereConstraints.push(queryWithSearch);
    }
    if (selectAll) {
      // Match the current filter/search, or default to all docs
      whereConstraints.push(parseSearchParams(searchParams)?.where || {
        id: {
          not_equals: ''
        }
      });
    } else {
      // If we're not selecting all, we need to select specific docs
      whereConstraints.push({
        id: {
          in: ids || []
        }
      });
    }
    return qs.stringify({
      locale,
      select: {},
      where: combineWhereConstraints(whereConstraints)
    }, {
      addQueryPrefix: true
    });
  }, [collection, searchParams, selectAll, ids, locale, where]);
  const onSuccess = () => {
    router.replace(qs.stringify({
      ...parseSearchParams(searchParams),
      page: selectAll ? '1' : undefined
    }, {
      addQueryPrefix: true
    }));
    clearRouteCache();
    closeModal(drawerSlug);
    if (typeof onSuccessFromProps === 'function') {
      onSuccessFromProps();
    }
  };
  const onFieldSelect = useCallback(async ({
    dispatchFields,
    formState,
    selected
  }) => {
    setIsInitializing(true);
    setSelectedFields(selected || []);
    const {
      state: state_0
    } = await getFormState({
      collectionSlug: collection.slug,
      docPermissions: collectionPermissions,
      docPreferences: null,
      formState,
      operation: 'update',
      schemaPath: collection.slug,
      select: unflatten(selected.reduce((acc_0, option_0) => {
        acc_0[option_0.value.path] = true;
        return acc_0;
      }, {})),
      skipValidation: true
    });
    dispatchFields({
      type: 'UPDATE_MANY',
      formState: state_0
    });
    setIsInitializing(false);
  }, [getFormState, collection.slug, collectionPermissions, setSelectedFields]);
  return /*#__PURE__*/_jsx(DocumentInfoProvider, {
    collectionSlug: collection.slug,
    currentEditor: user,
    hasPublishedDoc: false,
    id: null,
    initialData: {},
    isLocked: false,
    lastUpdateTime: 0,
    mostRecentVersionIsAutosaved: false,
    unpublishedVersionCount: 0,
    versionCount: 0,
    children: /*#__PURE__*/_jsx(OperationContext, {
      value: "update",
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__main`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__header`,
          children: [/*#__PURE__*/_jsx("h2", {
            className: `${baseClass}__header__title`,
            children: t('general:editingLabel', {
              count,
              label: getTranslation(count > 1 ? plural : singular, i18n)
            })
          }), /*#__PURE__*/_jsx("button", {
            "aria-label": t('general:close'),
            className: `${baseClass}__header__close`,
            id: `close-drawer__${drawerSlug}`,
            onClick: () => closeModal(drawerSlug),
            type: "button",
            children: /*#__PURE__*/_jsx(XIcon, {})
          })]
        }), /*#__PURE__*/_jsxs(Form, {
          className: `${baseClass}__form`,
          isInitializing: isInitializing,
          onChange: [onChange],
          onSuccess: onSuccess,
          children: [/*#__PURE__*/_jsx(FieldSelect, {
            fields: fields,
            onChange: onFieldSelect,
            permissions: collectionPermissions.fields
          }), selectedFields.length === 0 ? null : /*#__PURE__*/_jsx("div", {
            className: "render-fields",
            children: selectedFields.map((option_1, i) => {
              const {
                value: {
                  field,
                  fieldPermissions,
                  path
                }
              } = option_1;
              return /*#__PURE__*/_jsx(RenderField, {
                clientFieldConfig: field,
                indexPath: "",
                parentPath: "",
                parentSchemaPath: "",
                path: path,
                permissions: fieldPermissions
              }, `${path}-${i}`);
            })
          }), /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__sidebar-wrap`,
            children: /*#__PURE__*/_jsx("div", {
              className: `${baseClass}__sidebar`,
              children: /*#__PURE__*/_jsx("div", {
                className: `${baseClass}__sidebar-sticky-wrap`,
                children: /*#__PURE__*/_jsx("div", {
                  className: `${baseClass}__document-actions`,
                  children: collection?.versions?.drafts ? /*#__PURE__*/_jsxs(React.Fragment, {
                    children: [/*#__PURE__*/_jsx(SaveDraftButton, {
                      action: formatAdminURL({
                        apiRoute,
                        path: `/${collection.slug}${queryString}&draft=true`
                      }),
                      disabled: selectedFields.length === 0
                    }), /*#__PURE__*/_jsx(PublishButton, {
                      action: formatAdminURL({
                        apiRoute,
                        path: `/${collection.slug}${queryString}&draft=true`
                      }),
                      disabled: selectedFields.length === 0
                    })]
                  }) : /*#__PURE__*/_jsx(Submit, {
                    action: formatAdminURL({
                      apiRoute,
                      path: `/${collection.slug}${queryString}`
                    }),
                    disabled: selectedFields.length === 0
                  })
                })
              })
            })
          })]
        })]
      })
    })
  });
};
//# sourceMappingURL=DrawerContent.js.map