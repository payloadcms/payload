import { createContext, useContext } from 'react';
import { useContextSelector, createContext as createSelectorContext, useContext as useFullContext } from 'use-context-selector';
import { Context, FormFieldsContext as FormFieldsContextType } from './types';

const FormContext = createContext({} as Context);
const FormWatchContext = createContext({} as Context);
const SubmittedContext = createContext(false);
const ProcessingContext = createContext(false);
const ModifiedContext = createContext(false);
const FormFieldsContext = createSelectorContext<FormFieldsContextType>([{}, () => null]);

const useForm = (): Context => useContext(FormContext);
const useWatchForm = (): Context => useContext(FormWatchContext);
const useFormSubmitted = (): boolean => useContext(SubmittedContext);
const useFormProcessing = (): boolean => useContext(ProcessingContext);
const useFormModified = (): boolean => useContext(ModifiedContext);

const useFormFields = <Value = unknown>(selector: (context: FormFieldsContextType) => Value): Value => useContextSelector(FormFieldsContext, selector);
const useAllFormFields = (): FormFieldsContextType => useFullContext(FormFieldsContext);

export {
  SubmittedContext,
  ProcessingContext,
  ModifiedContext,
  useFormSubmitted,
  useFormProcessing,
  useFormModified,
  useForm,
  FormContext,
  FormFieldsContext,
  useFormFields,
  useAllFormFields,
  FormWatchContext,
  useWatchForm,
};
