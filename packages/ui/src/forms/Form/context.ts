import { createContext, useContext } from 'react'
import {
  createContext as createSelectorContext,
  useContextSelector,
  useContext as useFullContext,
} from 'use-context-selector'

import type { Context, FormFieldsContext as FormFieldsContextType } from './types'

const FormContext = createContext({} as Context)
const FormWatchContext = createContext({} as Context)
const SubmittedContext = createContext(false)
const ProcessingContext = createContext(false)
const ModifiedContext = createContext(false)
const FormFieldsContext = createSelectorContext<FormFieldsContextType>([{}, () => null])

/**
 * Get the state of the form, can be used to submit & validate the form.
 *
 * @see https://payloadcms.com/docs/admin/hooks#useform
 */
const useForm = (): Context => useContext(FormContext)
const useWatchForm = (): Context => useContext(FormWatchContext)
const useFormSubmitted = (): boolean => useContext(SubmittedContext)
const useFormProcessing = (): boolean => useContext(ProcessingContext)
const useFormModified = (): boolean => useContext(ModifiedContext)

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
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
  useAllFormFields,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
}
