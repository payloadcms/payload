import { createContext, useContext } from 'react';
import { Context } from './types';

const FormContext = createContext({} as Context);
const FormWatchContext = createContext({} as Context);
const SubmittedContext = createContext(false);
const ProcessingContext = createContext(false);
const ModifiedContext = createContext(false);

const useForm = (): Context => useContext(FormContext);
const useWatchForm = (): Context => useContext(FormWatchContext);
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
