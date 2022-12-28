const {
  useForm,
  /**
   * @deprecated useWatchForm is no longer preferred. If you need all form fields, prefer `useAllFormFields`.
   */
  useWatchForm,
  useFormFields,
  useAllFormFields,
  useFormSubmitted,
  useFormProcessing,
  useFormModified,
} = require('../dist/admin/components/forms/Form/context');

const useField = require('../dist/admin/components/forms/useField');

exports.useForm = useForm;
exports.useWatchForm = useWatchForm;
exports.useFormFields = useFormFields;
exports.useAllFormField = useAllFormFields;
exports.useFormSubmitted = useFormSubmitted;
exports.useFormProcessing = useFormProcessing;
exports.useFormModified = useFormModified;

exports.useField = useField;
exports.useFieldType = useField;

exports.Form = require('../dist/admin/components/forms/Form');
exports.Text = require('../dist/admin/components/forms/field-types/Text');
exports.TextInput = require('../dist/admin/components/forms/field-types/Text/Input');
exports.Group = require('../dist/admin/components/forms/field-types/Group');
exports.Select = require('../dist/admin/components/forms/field-types/Select');
exports.SelectInput = require('../dist/admin/components/forms/field-types/Select/Input');
exports.Checkbox = require('../dist/admin/components/forms/field-types/Checkbox');
exports.Submit = require('../dist/admin/components/forms/Submit');
exports.Label = require('../dist/admin/components/forms/Label');
exports.reduceFieldsToValues = require('../dist/admin/components/forms/Form/reduceFieldsToValues');
exports.getSiblingData = require('../dist/admin/components/forms/Form/getSiblingData');
exports.withCondition = require('../dist/admin/components/forms/withCondition');
