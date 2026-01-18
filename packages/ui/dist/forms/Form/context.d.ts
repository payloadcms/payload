import type { RenderedField } from 'payload';
import type { Context, FormFieldsContext as FormFieldsContextType } from './types.js';
declare const FormContext: import("react").Context<Context>;
declare const DocumentFormContext: import("react").Context<Context>;
declare const FormWatchContext: import("react").Context<Context>;
declare const SubmittedContext: import("react").Context<boolean>;
declare const ProcessingContext: import("react").Context<boolean>;
/**
 * If the form has started processing in the background (e.g.
 * if autosave is running), this will be true.
 */
declare const BackgroundProcessingContext: import("react").Context<boolean>;
declare const ModifiedContext: import("react").Context<boolean>;
declare const InitializingContext: import("react").Context<boolean>;
declare const FormFieldsContext: import("use-context-selector").Context<FormFieldsContextType>;
export type RenderedFieldSlots = Map<string, RenderedField>;
/**
 * Get the state of the form, can be used to submit & validate the form.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useform
 */
declare const useForm: () => Context;
/**
 * Get the state of the document-level form. This is useful if you need to access the document-level Form from within a child Form.
 * This is the case withing lexical Blocks, as each lexical blocks renders their own Form.
 */
declare const useDocumentForm: () => Context;
declare const useWatchForm: () => Context;
declare const useFormSubmitted: () => boolean;
declare const useFormProcessing: () => boolean;
/**
 * If the form has started processing in the background (e.g.
 * if autosave is running), this will be true.
 */
declare const useFormBackgroundProcessing: () => boolean;
declare const useFormModified: () => boolean;
declare const useFormInitializing: () => boolean;
/**
 * Get and set the value of a form field based on a selector
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useformfields
 */
declare const useFormFields: <Value = unknown>(selector: (context: FormFieldsContextType) => Value) => Value;
/**
 * Get the state of all form fields.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useallformfields
 */
declare const useAllFormFields: () => FormFieldsContextType;
export { BackgroundProcessingContext, DocumentFormContext, FormContext, FormFieldsContext, FormWatchContext, InitializingContext, ModifiedContext, ProcessingContext, SubmittedContext, useAllFormFields, useDocumentForm, useForm, useFormBackgroundProcessing, useFormFields, useFormInitializing, useFormModified, useFormProcessing, useFormSubmitted, useWatchForm, };
//# sourceMappingURL=context.d.ts.map