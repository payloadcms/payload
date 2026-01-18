'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { unflatten } from 'payload/shared';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../../elements/Button/index.js';
import { Form } from '../../../forms/Form/index.js';
import { FieldPathContext } from '../../../forms/RenderFields/context.js';
import { RenderField } from '../../../forms/RenderFields/RenderField.js';
import { XIcon } from '../../../icons/X/index.js';
import { useAuth } from '../../../providers/Auth/index.js';
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { abortAndIgnore, handleAbortRef } from '../../../utilities/abortAndIgnore.js';
import { FieldSelect } from '../../FieldSelect/index.js';
import { useFormsManager } from '../FormsManager/index.js';
import { baseClass } from './index.js';
import './index.scss';
import '../../../forms/RenderFields/index.scss';
export const EditManyBulkUploadsDrawerContent = props => {
  const {
    collection: {
      fields,
      labels: {
        plural,
        singular
      }
    } = {},
    collection,
    drawerSlug,
    forms
  } = props;
  const [isInitializing, setIsInitializing] = useState(false);
  const {
    permissions
  } = useAuth();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    closeModal
  } = useModal();
  const {
    bulkUpdateForm
  } = useFormsManager();
  const {
    getFormState
  } = useServerFunctions();
  const abortFormStateRef = React.useRef(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const collectionPermissions = permissions?.collections?.[collection.slug];
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
  const handleSubmit = useCallback(formState => {
    const pairedData = selectedFields.reduce((acc_0, option_0) => {
      if (formState[option_0.value.path]) {
        acc_0[option_0.value.path] = formState[option_0.value.path].value;
      }
      return acc_0;
    }, {});
    void bulkUpdateForm(pairedData, () => closeModal(drawerSlug));
  }, [closeModal, drawerSlug, bulkUpdateForm, selectedFields]);
  const onFieldSelect = useCallback(async ({
    dispatchFields,
    formState: formState_0,
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
      formState: formState_0,
      operation: 'update',
      schemaPath: collection.slug,
      select: unflatten(selected.reduce((acc_1, option_1) => {
        acc_1[option_1.value.path] = true;
        return acc_1;
      }, {})),
      skipValidation: true
    });
    dispatchFields({
      type: 'UPDATE_MANY',
      formState: state_0
    });
    setIsInitializing(false);
  }, [getFormState, collection, collectionPermissions]);
  return /*#__PURE__*/_jsxs("div", {
    className: `${baseClass}__main`,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__header`,
      children: [/*#__PURE__*/_jsx("h2", {
        className: `${baseClass}__header__title`,
        children: t('general:editingLabel', {
          count: forms.length,
          label: getTranslation(forms.length > 1 ? plural : singular, i18n)
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
      onSubmit: handleSubmit,
      children: [/*#__PURE__*/_jsx(FieldSelect, {
        fields: fields,
        onChange: onFieldSelect,
        permissions: collectionPermissions.fields
      }), selectedFields.length === 0 ? null : /*#__PURE__*/_jsx("div", {
        className: "render-fields",
        children: /*#__PURE__*/_jsx(FieldPathContext, {
          value: undefined,
          children: selectedFields.map((option_2, i) => {
            const {
              value: {
                field,
                fieldPermissions,
                path
              }
            } = option_2;
            return /*#__PURE__*/_jsx(RenderField, {
              clientFieldConfig: field,
              indexPath: "",
              parentPath: "",
              parentSchemaPath: "",
              path: path,
              permissions: fieldPermissions
            }, `${path}-${i}`);
          })
        })
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__sidebar-wrap`,
        children: /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__sidebar`,
          children: /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__sidebar-sticky-wrap`,
            children: /*#__PURE__*/_jsx("div", {
              className: `${baseClass}__document-actions`,
              children: /*#__PURE__*/_jsx(Button, {
                type: "submit",
                children: t('general:applyChanges')
              })
            })
          })
        })
      })]
    })]
  });
};
//# sourceMappingURL=DrawerContent.js.map