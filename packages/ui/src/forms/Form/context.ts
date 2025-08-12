'use client'
import type { RenderedField } from 'payload'

import { createContext, use } from 'react'
import {
  createContext as createSelectorContext,
  useContextSelector,
  useContext as useFullContext,
} from 'use-context-selector'

import type { Context, FormFieldsContext as FormFieldsContextType } from './types.js'

const FormContext = createContext({} as Context)
const DocumentFormContext = createContext({} as Context)
const FormWatchContext = createContext({} as Context)
const SubmittedContext = createContext(false)
const ProcessingContext = createContext(false)
/**
 * If the form has started processing in the background (e.g.
 * if autosave is running), this will be true.
 */
const BackgroundProcessingContext = createContext(false)
const ModifiedContext = createContext(false)
const InitializingContext = createContext(false)
const FormFieldsContext = createSelectorContext<FormFieldsContextType>([{}, () => null])

export type RenderedFieldSlots = Map<string, RenderedField>

/**
 * Get the state of the form, can be used to submit & validate the form.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useform
 */
const useForm = (): Context => use(FormContext)
/**
 * Get the state of the document-level form. This is useful if you need to access the document-level Form from within a child Form.
 * This is the case withing lexical Blocks, as each lexical blocks renders their own Form.
 */
const useDocumentForm = (): Context => use(DocumentFormContext)

const useWatchForm = (): Context => use(FormWatchContext)
const useFormSubmitted = (): boolean => use(SubmittedContext)
const useFormProcessing = (): boolean => use(ProcessingContext)
/**
 * If the form has started processing in the background (e.g.
 * if autosave is running), this will be true.
 */
const useFormBackgroundProcessing = (): boolean => use(BackgroundProcessingContext)
const useFormModified = (): boolean => use(ModifiedContext)
const useFormInitializing = (): boolean => use(InitializingContext)

/**
 * Get and set the value of a form field based on a selector
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useformfields
 */
const useFormFields = <Value = unknown>(
  selector: (context: FormFieldsContextType) => Value,
): Value => useContextSelector(FormFieldsContext, selector)

/**
 * Get the state of all form fields.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#useallformfields
 */
const useAllFormFields = (): FormFieldsContextType => useFullContext(FormFieldsContext)

export {
  BackgroundProcessingContext,
  DocumentFormContext,
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  InitializingContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
  useAllFormFields,
  useDocumentForm,
  useForm,
  useFormBackgroundProcessing,
  useFormFields,
  useFormInitializing,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
}
