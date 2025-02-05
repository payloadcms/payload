'use client'
import type { RenderedField } from 'payload'

import { createContext, useContext } from 'react'
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
const ModifiedContext = createContext(false)
const InitializingContext = createContext(false)
const FormFieldsContext = createSelectorContext<FormFieldsContextType>([{}, () => null])

export type RenderedFieldSlots = Map<string, RenderedField>

/**
 * Get the state of the form, can be used to submit & validate the form.
 *
 * @see https://payloadcms.com/docs/admin/hooks#useform
 */
const useForm = (): Context => useContext(FormContext)
/**
 * Get the state of the document-level form. This is useful if you need to access the document-level Form from within a child Form.
 * This is the case withing lexical Blocks, as each lexical blocks renders their own Form.
 */
const useDocumentForm = (): Context => useContext(DocumentFormContext)

const useWatchForm = (): Context => useContext(FormWatchContext)
const useFormSubmitted = (): boolean => useContext(SubmittedContext)
const useFormProcessing = (): boolean => useContext(ProcessingContext)
const useFormModified = (): boolean => useContext(ModifiedContext)
const useFormInitializing = (): boolean => useContext(InitializingContext)

/**
 * Get and set the value of a form field based on a selector
 *
 * @see https://payloadcms.com/docs/admin/hooks#useformfields
 */
const useFormFields = <Value = unknown>(
  selector: (context: FormFieldsContextType) => Value,
): Value => useContextSelector(FormFieldsContext, selector)

/**
 * Get the state of all form fields.
 *
 * @see https://payloadcms.com/docs/admin/hooks#useallformfields
 */
const useAllFormFields = (): FormFieldsContextType => useFullContext(FormFieldsContext)

export {
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
  useFormFields,
  useFormInitializing,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
}
