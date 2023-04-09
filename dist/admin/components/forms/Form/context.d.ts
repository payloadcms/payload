/// <reference types="react" />
import { Context, FormFieldsContext as FormFieldsContextType } from './types';
declare const FormContext: import("react").Context<Context>;
declare const FormWatchContext: import("react").Context<Context>;
declare const SubmittedContext: import("react").Context<boolean>;
declare const ProcessingContext: import("react").Context<boolean>;
declare const ModifiedContext: import("react").Context<boolean>;
declare const FormFieldsContext: import("use-context-selector").Context<FormFieldsContextType>;
/**
 * Get the state of the form, can be used to submit & validate the form.
 *
 * @see https://payloadcms.com/docs/admin/hooks#useform
 */
declare const useForm: () => Context;
declare const useWatchForm: () => Context;
declare const useFormSubmitted: () => boolean;
declare const useFormProcessing: () => boolean;
declare const useFormModified: () => boolean;
/**
 * Get and set the value of a form field based on a selector
 *
 * @see https://payloadcms.com/docs/admin/hooks#useformfields
 */
declare const useFormFields: <Value = unknown>(selector: (context: FormFieldsContextType) => Value) => Value;
/**
 * Get the state of all form fields.
 *
 * @see https://payloadcms.com/docs/admin/hooks#useallformfields
 */
declare const useAllFormFields: () => FormFieldsContextType;
export { SubmittedContext, ProcessingContext, ModifiedContext, useFormSubmitted, useFormProcessing, useFormModified, useForm, FormContext, FormFieldsContext, useFormFields, useAllFormFields, FormWatchContext, useWatchForm, };
