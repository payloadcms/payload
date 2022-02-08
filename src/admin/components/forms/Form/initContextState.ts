import {
  Fields,
  Field,
  Data,
  DispatchFields,
  Submit,
  Context,
  GetSiblingData,
  GetUnflattenedValues,
  ValidateForm,
  CreateFormData,
  SetModified,
  SetProcessing,
  SetSubmitted,
  Reset,
} from './types';

const submit: Submit = () => undefined;
const getSiblingData: GetSiblingData = () => undefined;
const getUnflattenedValues: GetUnflattenedValues = () => ({});
const dispatchFields: DispatchFields = () => undefined;
const validateForm: ValidateForm = () => undefined;
const createFormData: CreateFormData = () => undefined;

const setModified: SetModified = () => undefined;
const setProcessing: SetProcessing = () => undefined;
const setSubmitted: SetSubmitted = () => undefined;
const reset: Reset = () => undefined;

const initialContextState: Context = {
  getFields: (): Fields => ({ }),
  getField: (): Field => undefined,
  getData: (): Data => undefined,
  getSiblingData,
  getDataByPath: () => undefined,
  getUnflattenedValues,
  validateForm,
  createFormData,
  submit,
  dispatchFields,
  setModified,
  setProcessing,
  setSubmitted,
  initialState: {},
  fields: {},
  disabled: false,
  formRef: null,
  reset,
};

export default initialContextState;
