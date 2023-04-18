"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWatchForm = exports.FormWatchContext = exports.useAllFormFields = exports.useFormFields = exports.FormFieldsContext = exports.FormContext = exports.useForm = exports.useFormModified = exports.useFormProcessing = exports.useFormSubmitted = exports.ModifiedContext = exports.ProcessingContext = exports.SubmittedContext = void 0;
const react_1 = require("react");
const use_context_selector_1 = require("use-context-selector");
const FormContext = (0, react_1.createContext)({});
exports.FormContext = FormContext;
const FormWatchContext = (0, react_1.createContext)({});
exports.FormWatchContext = FormWatchContext;
const SubmittedContext = (0, react_1.createContext)(false);
exports.SubmittedContext = SubmittedContext;
const ProcessingContext = (0, react_1.createContext)(false);
exports.ProcessingContext = ProcessingContext;
const ModifiedContext = (0, react_1.createContext)(false);
exports.ModifiedContext = ModifiedContext;
const FormFieldsContext = (0, use_context_selector_1.createContext)([{}, () => null]);
exports.FormFieldsContext = FormFieldsContext;
/**
 * Get the state of the form, can be used to submit & validate the form.
 *
 * @see https://payloadcms.com/docs/admin/hooks#useform
 */
const useForm = () => (0, react_1.useContext)(FormContext);
exports.useForm = useForm;
const useWatchForm = () => (0, react_1.useContext)(FormWatchContext);
exports.useWatchForm = useWatchForm;
const useFormSubmitted = () => (0, react_1.useContext)(SubmittedContext);
exports.useFormSubmitted = useFormSubmitted;
const useFormProcessing = () => (0, react_1.useContext)(ProcessingContext);
exports.useFormProcessing = useFormProcessing;
const useFormModified = () => (0, react_1.useContext)(ModifiedContext);
exports.useFormModified = useFormModified;
/**
 * Get and set the value of a form field based on a selector
 *
 * @see https://payloadcms.com/docs/admin/hooks#useformfields
 */
const useFormFields = (selector) => (0, use_context_selector_1.useContextSelector)(FormFieldsContext, selector);
exports.useFormFields = useFormFields;
/**
 * Get the state of all form fields.
 *
 * @see https://payloadcms.com/docs/admin/hooks#useallformfields
 */
const useAllFormFields = () => (0, use_context_selector_1.useContext)(FormFieldsContext);
exports.useAllFormFields = useAllFormFields;
//# sourceMappingURL=context.js.map