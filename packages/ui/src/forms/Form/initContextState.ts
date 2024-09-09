'use client'
import type { Data, FormField, FormState } from 'payload'

import type {
  Context,
  CreateFormData,
  DispatchFields,
  GetSiblingData,
  Reset,
  SetModified,
  SetProcessing,
  SetSubmitted,
  Submit,
  ValidateForm,
} from './types.js'

const submit: Submit = () => undefined
const getSiblingData: GetSiblingData = () => undefined
const dispatchFields: DispatchFields = () => undefined
const validateForm: ValidateForm = () => undefined
const createFormData: CreateFormData = () => undefined

const setModified: SetModified = () => undefined
const setProcessing: SetProcessing = () => undefined
const setSubmitted: SetSubmitted = () => undefined
const reset: Reset = () => undefined

export const initContextState: Context = {
  addFieldRow: () => undefined,
  buildRowErrors: () => undefined,
  createFormData,
  disabled: false,
  dispatchFields,
  fields: {},
  formRef: null,
  getData: (): Data => undefined,
  getDataByPath: () => undefined,
  getField: (): FormField => undefined,
  getFields: (): FormState => ({}),
  getSiblingData,
  initializing: undefined,
  removeFieldRow: () => undefined,
  replaceFieldRow: () => undefined,
  replaceState: () => undefined,
  reset,
  setDisabled: () => undefined,
  setModified,
  setProcessing,
  setSubmitted,
  submit,
  validateForm,
}
