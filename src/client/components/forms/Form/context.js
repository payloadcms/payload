import { createContext, useContext } from 'react';

const FormContext = createContext({});
const FieldContext = createContext({});
const SubmittedContext = createContext(false);
const ProcessingContext = createContext(false);
const ModifiedContext = createContext(false);

const useForm = () => useContext(FormContext);
const useFormFields = () => useContext(FieldContext);
const useFormSubmitted = () => useContext(SubmittedContext);
const useFormProcessing = () => useContext(ProcessingContext);
const useFormModified = () => useContext(ModifiedContext);

export {
  FormContext,
  FieldContext,
  SubmittedContext,
  ProcessingContext,
  ModifiedContext,
  useForm,
  useFormFields,
  useFormSubmitted,
  useFormProcessing,
  useFormModified,
};
