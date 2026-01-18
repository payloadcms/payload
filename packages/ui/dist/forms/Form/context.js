'use client';

import { createContext, use } from 'react';
import { createContext as createSelectorContext, useContextSelector, useContext as useFullContext } from 'use-context-selector';
const FormContext = createContext({});
const DocumentFormContext = createContext({});
const FormWatchContext = createContext({});
const SubmittedContext = createContext(false);
const ProcessingContext = createContext(false);
/**
 * If the form has started processing in the background (e.g.
 * if autosave is running), this will be true.
 */
const BackgroundProcessingContext = createContext(false);
const ModifiedContext = createContext(false);
const InitializingContext = createContext(false);
const FormFieldsContext = createSelectorContext([{}, () => null]);
/**
 * Get the state of the form, can be used to submit & validate the form.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useform
 */
const useForm = () => use(FormContext);
/**
 * Get the state of the document-level form. This is useful if you need to access the document-level Form from within a child Form.
 * This is the case withing lexical Blocks, as each lexical blocks renders their own Form.
 */
const useDocumentForm = () => use(DocumentFormContext);
const useWatchForm = () => use(FormWatchContext);
const useFormSubmitted = () => use(SubmittedContext);
const useFormProcessing = () => use(ProcessingContext);
/**
 * If the form has started processing in the background (e.g.
 * if autosave is running), this will be true.
 */
const useFormBackgroundProcessing = () => use(BackgroundProcessingContext);
const useFormModified = () => use(ModifiedContext);
const useFormInitializing = () => use(InitializingContext);
/**
 * Get and set the value of a form field based on a selector
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useformfields
 */
const useFormFields = selector => {
  return useContextSelector(FormFieldsContext, selector);
};
/**
 * Get the state of all form fields.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useallformfields
 */
const useAllFormFields = () => {
  return useFullContext(FormFieldsContext);
};
export { BackgroundProcessingContext, DocumentFormContext, FormContext, FormFieldsContext, FormWatchContext, InitializingContext, ModifiedContext, ProcessingContext, SubmittedContext, useAllFormFields, useDocumentForm, useForm, useFormBackgroundProcessing, useFormFields, useFormInitializing, useFormModified, useFormProcessing, useFormSubmitted, useWatchForm };
//# sourceMappingURL=context.js.map