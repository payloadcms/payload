'use client';

import { c as _c } from "react/compiler-runtime";
import React, { useCallback, useMemo, useRef } from 'react';
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useOperation } from '../../providers/Operation/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { useDocumentForm, useForm, useFormFields, useFormInitializing, useFormProcessing, useFormSubmitted } from '../Form/context.js';
import { useFieldPath } from '../RenderFields/context.js';
const useFieldInForm = options => {
  const $ = _c(65);
  let t0;
  if ($[0] !== options) {
    t0 = options || {};
    $[0] = options;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const {
    disableFormData: t1,
    hasRows,
    path: pathFromOptions,
    potentiallyStalePath,
    validate
  } = t0;
  const disableFormData = t1 === undefined ? false : t1;
  const pathFromContext = useFieldPath();
  const path = pathFromOptions || pathFromContext || potentiallyStalePath;
  const submitted = useFormSubmitted();
  const processing = useFormProcessing();
  const initializing = useFormInitializing();
  const {
    user
  } = useAuth();
  const {
    id,
    collectionSlug
  } = useDocumentInfo();
  const operation = useOperation();
  const dispatchField = useFormFields(_temp);
  let t2;
  if ($[2] !== path) {
    t2 = t3 => {
      const [fields] = t3;
      return fields && fields?.[path] || null;
    };
    $[2] = path;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const field = useFormFields(t2);
  const {
    t
  } = useTranslation();
  const {
    config
  } = useConfig();
  const {
    getData,
    getDataByPath,
    getSiblingData,
    setModified
  } = useForm();
  const documentForm = useDocumentForm();
  const filterOptions = field?.filterOptions;
  const value = field?.value;
  const initialValue = field?.initialValue;
  const valid = typeof field?.valid === "boolean" ? field.valid : true;
  const showError = valid === false && submitted;
  const prevValid = useRef(valid);
  const prevErrorMessage = useRef(field?.errorMessage);
  let t3;
  if ($[4] !== path) {
    t3 = path ? path.split(".") : [];
    $[4] = path;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const pathSegments = t3;
  let t4;
  if ($[6] !== disableFormData || $[7] !== dispatchField || $[8] !== hasRows || $[9] !== path || $[10] !== setModified) {
    t4 = (e, t5) => {
      const disableModifyingForm = t5 === undefined ? false : t5;
      const isEvent = e && typeof e === "object" && typeof e.preventDefault === "function" && typeof e.stopPropagation === "function";
      const val = isEvent ? e.target.value : e;
      dispatchField({
        type: "UPDATE",
        disableFormData: disableFormData || hasRows && val > 0,
        path,
        value: val
      });
      if (!disableModifyingForm) {
        setModified(true);
      }
    };
    $[6] = disableFormData;
    $[7] = dispatchField;
    $[8] = hasRows;
    $[9] = path;
    $[10] = setModified;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  const setValue = t4;
  const t5 = field?.blocksFilterOptions;
  const t6 = field?.customComponents;
  const t7 = processing || initializing;
  const t8 = field?.errorMessage;
  let t9;
  if ($[12] !== field?.errorPaths) {
    t9 = field?.errorPaths || [];
    $[12] = field?.errorPaths;
    $[13] = t9;
  } else {
    t9 = $[13];
  }
  const t10 = field?.rows;
  const t11 = field?.selectFilterOptions;
  const t12 = field?.valid;
  let t13;
  if ($[14] !== filterOptions || $[15] !== initialValue || $[16] !== initializing || $[17] !== path || $[18] !== processing || $[19] !== setValue || $[20] !== showError || $[21] !== submitted || $[22] !== t10 || $[23] !== t11 || $[24] !== t12 || $[25] !== t5 || $[26] !== t6 || $[27] !== t7 || $[28] !== t8 || $[29] !== t9 || $[30] !== value) {
    t13 = {
      blocksFilterOptions: t5,
      customComponents: t6,
      disabled: t7,
      errorMessage: t8,
      errorPaths: t9,
      filterOptions,
      formInitializing: initializing,
      formProcessing: processing,
      formSubmitted: submitted,
      initialValue,
      path,
      rows: t10,
      selectFilterOptions: t11,
      setValue,
      showError,
      valid: t12,
      value
    };
    $[14] = filterOptions;
    $[15] = initialValue;
    $[16] = initializing;
    $[17] = path;
    $[18] = processing;
    $[19] = setValue;
    $[20] = showError;
    $[21] = submitted;
    $[22] = t10;
    $[23] = t11;
    $[24] = t12;
    $[25] = t5;
    $[26] = t6;
    $[27] = t7;
    $[28] = t8;
    $[29] = t9;
    $[30] = value;
    $[31] = t13;
  } else {
    t13 = $[31];
  }
  const result = t13;
  let t14;
  if ($[32] !== collectionSlug || $[33] !== config || $[34] !== disableFormData || $[35] !== dispatchField || $[36] !== documentForm || $[37] !== field || $[38] !== getData || $[39] !== getDataByPath || $[40] !== getSiblingData || $[41] !== hasRows || $[42] !== id || $[43] !== operation || $[44] !== path || $[45] !== pathSegments || $[46] !== t || $[47] !== user || $[48] !== validate || $[49] !== value) {
    t14 = () => {
      const validateField = async () => {
        let valueToValidate = value;
        if (field?.rows && Array.isArray(field.rows)) {
          valueToValidate = getDataByPath(path);
        }
        let errorMessage = prevErrorMessage.current;
        let valid_0 = prevValid.current;
        const data = getData();
        const isValid = typeof validate === "function" ? await validate(valueToValidate, {
          id,
          blockData: undefined,
          collectionSlug,
          data: documentForm?.getData ? documentForm.getData() : data,
          event: "onChange",
          operation,
          path: pathSegments,
          preferences: {},
          req: {
            payload: {
              config
            },
            t,
            user
          },
          siblingData: getSiblingData(path)
        }) : typeof prevErrorMessage.current === "string" ? prevErrorMessage.current : prevValid.current;
        if (typeof isValid === "string") {
          valid_0 = false;
          errorMessage = isValid;
        } else {
          if (typeof isValid === "boolean") {
            valid_0 = isValid;
            errorMessage = undefined;
          }
        }
        if (valid_0 !== prevValid.current || errorMessage !== prevErrorMessage.current) {
          prevValid.current = valid_0;
          prevErrorMessage.current = errorMessage;
          const update = {
            type: "UPDATE",
            errorMessage,
            path,
            rows: field?.rows,
            valid: valid_0,
            validate,
            value
          };
          if (disableFormData || (hasRows ? typeof value === "number" && value > 0 : false)) {
            update.disableFormData = true;
          }
          if (typeof dispatchField === "function") {
            dispatchField(update);
          }
        }
      };
      validateField();
    };
    $[32] = collectionSlug;
    $[33] = config;
    $[34] = disableFormData;
    $[35] = dispatchField;
    $[36] = documentForm;
    $[37] = field;
    $[38] = getData;
    $[39] = getDataByPath;
    $[40] = getSiblingData;
    $[41] = hasRows;
    $[42] = id;
    $[43] = operation;
    $[44] = path;
    $[45] = pathSegments;
    $[46] = t;
    $[47] = user;
    $[48] = validate;
    $[49] = value;
    $[50] = t14;
  } else {
    t14 = $[50];
  }
  const t15 = field?.rows;
  let t16;
  if ($[51] !== collectionSlug || $[52] !== disableFormData || $[53] !== dispatchField || $[54] !== getData || $[55] !== getDataByPath || $[56] !== getSiblingData || $[57] !== id || $[58] !== operation || $[59] !== path || $[60] !== t15 || $[61] !== user || $[62] !== validate || $[63] !== value) {
    t16 = [value, disableFormData, dispatchField, getData, getSiblingData, getDataByPath, id, operation, path, user, validate, t15, collectionSlug];
    $[51] = collectionSlug;
    $[52] = disableFormData;
    $[53] = dispatchField;
    $[54] = getData;
    $[55] = getDataByPath;
    $[56] = getSiblingData;
    $[57] = id;
    $[58] = operation;
    $[59] = path;
    $[60] = t15;
    $[61] = user;
    $[62] = validate;
    $[63] = value;
    $[64] = t16;
  } else {
    t16 = $[64];
  }
  useThrottledEffect(t14, 150, t16);
  return result;
};
/**
 * Context to allow providing useField value for fields directly, if managed outside the Form
 *
 * @experimental
 */
export const FieldContext = /*#__PURE__*/React.createContext(undefined);
/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#usefield
 */
export const useField = options => {
  const pathFromContext = useFieldPath();
  const fieldContext = React.use(FieldContext);
  // Lock the mode on first render so hook order is stable forever. This ensures
  // that hooks are called in the same order each time a component renders => should
  // not break the rule of hooks.
  const hasFieldContext = React.useRef(null);
  if (hasFieldContext.current === null) {
    // Use field context, if a field context exists **and** the path matches. If the path
    // does not match, this could be the field context of a parent field => there likely is
    // a nested <Form /> we should use instead => 'form'
    const currentPath = options?.path || pathFromContext || options?.potentiallyStalePath;
    hasFieldContext.current = fieldContext && currentPath && fieldContext.path === currentPath ? true : false;
  }
  if (hasFieldContext.current === true) {
    if (!fieldContext) {
      // Provider was removed after mount. That violates hook guarantees.
      throw new Error('FieldContext was removed after mount. This breaks hook ordering.');
    }
    return fieldContext;
  }
  // We intentionally guard this hook call with a mode that is fixed on first render.
  // The order is consistent across renders. Silence the linter’s false positive.
  // eslint-disable-next-line react-compiler/react-compiler
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useFieldInForm(options);
};
function _temp(t0) {
  const [, dispatch] = t0;
  return dispatch;
}
//# sourceMappingURL=index.js.map