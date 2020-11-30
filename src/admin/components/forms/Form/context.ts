import { createContext, useContext } from 'react';
import { Context as FormContext } from './types';

const FormContext = createContext({} as FormContext);
const FormWatchContext = createContext({} as FormContext);
const SubmittedContext = createContext(false);
const ProcessingContext = createContext(false);
const ModifiedContext = createContext(false);

const useForm = (): FormContext => useContext(FormContext);
const useWatchForm = (): FormContext => useContext(FormWatchContext);
const useFormSubmitted = (): boolean => useContext(SubmittedContext);
const useFormProcessing = (): boolean => useContext(ProcessingContext);
const useFormModified = (): boolean => useContext(ModifiedContext);

export {
  FormContext,
  FormWatchContext,
  SubmittedContext,
  ProcessingContext,
  ModifiedContext,
  useForm,
  useWatchForm,
  useFormSubmitted,
  useFormProcessing,
  useFormModified,
};
