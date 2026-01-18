'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TZDateMini as TZDate } from '@date-fns/tz/date/mini';
import { getTranslation } from '@payloadcms/translations';
import { transpose } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { DatePickerField } from '../../elements/DatePicker/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { TimezonePicker } from '../../elements/TimezonePicker/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useForm, useFormFields } from '../../forms/Form/context.js';
import { useField } from '../../forms/useField/index.js';
import './index.scss';
import { withCondition } from '../../forms/withCondition/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { fieldBaseClass } from '../shared/index.js';
const baseClass = 'date-time-field';
const DateTimeFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        date: datePickerProps,
        description,
        placeholder
      } = {},
      label,
      localized,
      required,
      timezone
    },
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const pickerAppearance = datePickerProps?.pickerAppearance || 'default';
  // Get the user timezone so we can adjust the displayed value against it
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const {
    config
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const {
    dispatchFields,
    setModified
  } = useForm();
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === 'function') {
      return validate(value, {
        ...options,
        required
      });
    }
  }, [validate, required]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    path,
    setValue,
    showError,
    value: value_0
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const timezonePath = path + '_tz';
  const timezoneField = useFormFields(([fields, _]) => fields?.[timezonePath]);
  const supportedTimezones = useMemo(() => {
    if (timezone && typeof timezone === 'object' && timezone.supportedTimezones) {
      return timezone.supportedTimezones;
    }
    return config.admin.timezones.supportedTimezones;
  }, [config.admin.timezones.supportedTimezones, timezone]);
  /**
  * Date appearance doesn't include timestamps,
  * which means we need to pin the time to always 12:00 for the selected date
  */
  const isDateOnly = ['dayOnly', 'default', 'monthOnly'].includes(pickerAppearance);
  const selectedTimezone = timezoneField?.value;
  const timezoneRequired = required || timezone && typeof timezone === 'object' && timezone.required;
  // The displayed value should be the original value, adjusted to the user's timezone
  const displayedValue = useMemo(() => {
    if (timezone && selectedTimezone && userTimezone && value_0) {
      // Create TZDate instances for the selected timezone and the user's timezone
      // These instances allow us to transpose the date between timezones while keeping the same time value
      const DateWithOriginalTz = TZDate.tz(selectedTimezone);
      const DateWithUserTz = TZDate.tz(userTimezone);
      const modifiedDate = new TZDate(value_0).withTimeZone(selectedTimezone);
      // Transpose the date to the selected timezone
      const dateWithTimezone = transpose(modifiedDate, DateWithOriginalTz);
      // Transpose the date to the user's timezone - this is necessary because the react-datepicker component insists on displaying the date in the user's timezone
      const dateWithUserTimezone = transpose(dateWithTimezone, DateWithUserTz);
      return dateWithUserTimezone.toISOString();
    }
    return value_0;
  }, [timezone, selectedTimezone, value_0, userTimezone]);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  const onChange = useCallback(incomingDate => {
    if (!(readOnly || disabled)) {
      if (timezone && selectedTimezone && incomingDate) {
        // Create TZDate instances for the selected timezone
        const TZDateWithSelectedTz = TZDate.tz(selectedTimezone);
        if (isDateOnly) {
          // We need to offset this hardcoded hour offset from the DatePicker elemenent
          // this can be removed in 4.0 when we remove the hardcoded offset as it is a breaking change
          // const tzOffset = incomingDate.getTimezoneOffset() / 60
          const incomingOffset = incomingDate.getTimezoneOffset() / 60;
          const originalHour = incomingDate.getHours() + incomingOffset;
          incomingDate.setHours(originalHour);
          // Convert the original date as picked into the desired timezone.
          const dateToSelectedTz = transpose(incomingDate, TZDateWithSelectedTz);
          setValue(dateToSelectedTz.toISOString() || null);
        } else {
          // Creates a TZDate instance for the user's timezone  — this is default behaviour of TZDate as it wraps the Date constructor
          const dateToUserTz = new TZDate(incomingDate);
          // Transpose the date to the selected timezone
          const dateWithTimezone_0 = transpose(dateToUserTz, TZDateWithSelectedTz);
          setValue(dateWithTimezone_0.toISOString() || null);
        }
      } else {
        setValue(incomingDate?.toISOString() || null);
      }
    }
  }, [readOnly, disabled, timezone, selectedTimezone, isDateOnly, setValue]);
  const onChangeTimezone = useCallback(timezone_0 => {
    if (timezonePath) {
      dispatchFields({
        type: 'UPDATE',
        path: timezonePath,
        value: timezone_0
      });
      setModified(true);
    }
  }, [dispatchFields, setModified, timezonePath]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, showError && `${baseClass}--has-error`, (readOnly || disabled) && 'read-only'].filter(Boolean).join(' '),
    style: styles,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      id: `field-${path.replace(/\./g, '__')}`,
      children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          path: path,
          showError: showError
        })
      }), BeforeInput, /*#__PURE__*/_jsx(DatePickerField, {
        ...datePickerProps,
        onChange: onChange,
        overrides: {
          ...datePickerProps?.overrides
        },
        placeholder: getTranslation(placeholder, i18n),
        readOnly: readOnly || disabled,
        value: displayedValue
      }), timezone && supportedTimezones.length > 0 && /*#__PURE__*/_jsx(TimezonePicker, {
        id: `${path}-timezone-picker`,
        onChange: onChangeTimezone,
        options: supportedTimezones,
        readOnly: readOnly || disabled,
        required: timezoneRequired,
        selectedTimezone: selectedTimezone
      }), AfterInput]
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
export const DateTimeField = withCondition(DateTimeFieldComponent);
//# sourceMappingURL=index.js.map