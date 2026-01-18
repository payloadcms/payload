'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { ReactSelect } from '../../elements/ReactSelect/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
export const TextInput = props => {
  const $ = _c(32);
  const {
    AfterInput,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    hasMany,
    htmlAttributes,
    inputRef,
    Label,
    label,
    localized,
    maxRows,
    onChange,
    onKeyDown,
    path,
    placeholder: placeholderFromProps,
    readOnly,
    required,
    rtl,
    showError,
    style,
    value,
    valueToRender
  } = props;
  const {
    i18n,
    t
  } = useTranslation();
  const editableProps = _temp2;
  let t0;
  if ($[0] !== AfterInput || $[1] !== BeforeInput || $[2] !== Description || $[3] !== Error || $[4] !== Label || $[5] !== className || $[6] !== description || $[7] !== hasMany || $[8] !== htmlAttributes || $[9] !== i18n || $[10] !== inputRef || $[11] !== label || $[12] !== localized || $[13] !== maxRows || $[14] !== onChange || $[15] !== onKeyDown || $[16] !== path || $[17] !== placeholderFromProps || $[18] !== readOnly || $[19] !== required || $[20] !== rtl || $[21] !== showError || $[22] !== style || $[23] !== t || $[24] !== value || $[25] !== valueToRender) {
    const placeholder = getTranslation(placeholderFromProps, i18n);
    const t1 = showError && "error";
    const t2 = readOnly && "read-only";
    const t3 = hasMany && "has-many";
    let t4;
    if ($[27] !== className || $[28] !== t1 || $[29] !== t2 || $[30] !== t3) {
      t4 = [fieldBaseClass, "text", className, t1, t2, t3].filter(Boolean);
      $[27] = className;
      $[28] = t1;
      $[29] = t2;
      $[30] = t3;
      $[31] = t4;
    } else {
      t4 = $[31];
    }
    t0 = _jsxs("div", {
      className: t4.join(" "),
      style,
      children: [_jsx(RenderCustomComponent, {
        CustomComponent: Label,
        Fallback: _jsx(FieldLabel, {
          label,
          localized,
          path,
          required
        })
      }), _jsxs("div", {
        className: `${fieldBaseClass}__wrap`,
        children: [_jsx(RenderCustomComponent, {
          CustomComponent: Error,
          Fallback: _jsx(FieldError, {
            path,
            showError
          })
        }), BeforeInput, hasMany ? _jsx(ReactSelect, {
          className: `field-${path.replace(/\./g, "__")}`,
          components: {
            DropdownIndicator: null
          },
          customProps: {
            editableProps
          },
          disabled: readOnly,
          filterOption: () => !maxRows ? true : !(Array.isArray(value) && maxRows && value.length >= maxRows),
          isClearable: false,
          isCreatable: true,
          isMulti: true,
          isSortable: true,
          menuIsOpen: false,
          noOptionsMessage: () => {
            const isOverHasMany = Array.isArray(value) && value.length >= maxRows;
            if (isOverHasMany) {
              return t("validation:limitReached", {
                max: maxRows,
                value: value.length + 1
              });
            }
            return null;
          },
          onChange,
          options: [],
          placeholder,
          showError,
          value: valueToRender
        }) : _jsx("input", {
          "data-rtl": rtl,
          disabled: readOnly,
          id: `field-${path?.replace(/\./g, "__")}`,
          name: path,
          onChange,
          onKeyDown,
          placeholder,
          ref: inputRef,
          type: "text",
          value: value || "",
          ...(htmlAttributes ?? {})
        }), AfterInput, _jsx(RenderCustomComponent, {
          CustomComponent: Description,
          Fallback: _jsx(FieldDescription, {
            description,
            path
          })
        })]
      })]
    });
    $[0] = AfterInput;
    $[1] = BeforeInput;
    $[2] = Description;
    $[3] = Error;
    $[4] = Label;
    $[5] = className;
    $[6] = description;
    $[7] = hasMany;
    $[8] = htmlAttributes;
    $[9] = i18n;
    $[10] = inputRef;
    $[11] = label;
    $[12] = localized;
    $[13] = maxRows;
    $[14] = onChange;
    $[15] = onKeyDown;
    $[16] = path;
    $[17] = placeholderFromProps;
    $[18] = readOnly;
    $[19] = required;
    $[20] = rtl;
    $[21] = showError;
    $[22] = style;
    $[23] = t;
    $[24] = value;
    $[25] = valueToRender;
    $[26] = t0;
  } else {
    t0 = $[26];
  }
  return t0;
};
function _temp(event) {
  event.currentTarget.contentEditable = "false";
}
function _temp2(data, className_0, selectProps) {
  const editableClassName = `${className_0}--editable`;
  return {
    onBlur: _temp,
    onClick: event_0 => {
      event_0.currentTarget.contentEditable = "true";
      event_0.currentTarget.classList.add(editableClassName);
      event_0.currentTarget.focus();
    },
    onKeyDown: event_1 => {
      if (!event_1.nativeEvent.isComposing && (event_1.key === "Enter" || event_1.key === "Tab" || event_1.key === "Escape")) {
        event_1.currentTarget.contentEditable = "false";
        event_1.currentTarget.classList.remove(editableClassName);
        data.value.value = event_1.currentTarget.innerText;
        data.label = event_1.currentTarget.innerText;
        if (data.value.value.replaceAll("\n", "")) {
          selectProps.onChange(selectProps.value, {
            action: "create-option",
            option: data
          });
        } else {
          if (Array.isArray(selectProps.value)) {
            const newValues = selectProps.value.filter(v => v.id !== data.id);
            selectProps.onChange(newValues, {
              action: "pop-value",
              removedValue: data
            });
          }
        }
        event_1.preventDefault();
      }
      event_1.stopPropagation();
    }
  };
}
//# sourceMappingURL=Input.js.map