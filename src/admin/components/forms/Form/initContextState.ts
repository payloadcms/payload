import {
  Fields,
  Field,
  Data,
  DispatchFields,
  Submit,
  Context,
  GetSiblingData,
  ValidateForm,
  CreateFormData,
  SetModified,
  SetProcessing,
  SetSubmitted,
  Reset,
} from './types';

const submit: Submit = () => undefined;
const getSiblingData: GetSiblingData = () => undefined;
const dispatchFields: DispatchFields = () => undefined;
const validateForm: ValidateForm = () => undefined;
const createFormData: CreateFormData = () => undefined;

const setModified: SetModified = () => undefined;
const setProcessing: SetProcessing = () => undefined;
const setSubmitted: SetSubmitted = () => undefined;
const reset: Reset = () => undefined;

const initialContextState: Context = {
  getFields: (): Fields => ({}),
  getField: (): Field => undefined,
  getData: (): Data => undefined,
  getSiblingData,
  getDataByPath: () => undefined,
  validateForm,
  createFormData,
  submit,
  dispatchFields,
  setModified,
  setProcessing,
  setSubmitted,
  fields: {},
  disabled: false,
  formRef: null,
  reset,
  replaceState: () => undefined,
};

export default initialContextState;
