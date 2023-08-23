exports.useForm = require('../dist/admin/components/forms/Form/context').useForm;

/**
 * @deprecated useWatchForm is no longer preferred. If you need all form fields, prefer `useAllFormFields`.
 */
exports.useWatchForm = require('../dist/admin/components/forms/Form/context').useWatchForm;

exports.useFormFields = require('../dist/admin/components/forms/Form/context').useFormFields;

exports.useAllFormFields = require('../dist/admin/components/forms/Form/context').useAllFormFields;

exports.useFormSubmitted = require('../dist/admin/components/forms/Form/context').useFormSubmitted;

exports.useFormProcessing = require('../dist/admin/components/forms/Form/context').useFormProcessing;

exports.useFormModified = require('../dist/admin/components/forms/Form/context').useFormModified;

exports.useField = require('../dist/admin/components/forms/useField').default;

/**
 * @deprecated This method is now called useField. The useFieldType alias will be removed in an upcoming version.
 */
exports.useFieldType = require('../dist/admin/components/forms/useField').default;

exports.Form = require('../dist/admin/components/forms/Form').default;

exports.Text = require('../dist/admin/components/forms/field-types/Text').default;
exports.TextInput = require('../dist/admin/components/forms/field-types/Text/Input').default;

exports.Group = require('../dist/admin/components/forms/field-types/Group').default;

exports.Select = require('../dist/admin/components/forms/field-types/Select').default;
exports.SelectInput = require('../dist/admin/components/forms/field-types/Select/Input').default;

exports.Checkbox = require('../dist/admin/components/forms/field-types/Checkbox').default;
exports.Submit = require('../dist/admin/components/forms/Submit').default;
exports.Label = require('../dist/admin/components/forms/Label').default;

exports.reduceFieldsToValues = require('../dist/admin/components/forms/Form/reduceFieldsToValues').default;
exports.getSiblingData = require('../dist/admin/components/forms/Form/getSiblingData').default;

exports.withCondition = require('../dist/admin/components/forms/withCondition').default;
