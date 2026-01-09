import type { FormState, UploadEdits } from 'payload'

import { v4 as uuidv4 } from 'uuid'

import type { InitialForms } from './index.js'

export type State = {
  activeIndex: number
  forms: {
    errorCount: number
    exceedsLimit: boolean
    formID: string
    formState: FormState
    missingFile: boolean
    uploadEdits?: UploadEdits
  }[]
  totalErrorCount: number
}

type Action =
  | {
      count: number
      index: number
      type: 'UPDATE_ERROR_COUNT'
    }
  | {
      errorCount: number
      exceedsLimit?: boolean
      formState: FormState
      index: number
      missingFile?: boolean
      type: 'UPDATE_FORM'
      updatedFields?: Record<string, unknown>
      uploadEdits?: UploadEdits
    }
  | {
      forms: InitialForms
      type: 'ADD_FORMS'
    }
  | {
      index: number
      type: 'REMOVE_FORM'
    }
  | {
      index: number
      type: 'SET_ACTIVE_INDEX'
    }
  | {
      state: Partial<State>
      type: 'REPLACE'
    }

export function formsManagementReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FORMS': {
      const newForms: State['forms'] = []
      for (let i = 0; i < action.forms.length; i++) {
        newForms[i] = {
          errorCount: 0,
          exceedsLimit: false,
          formID: action.forms[i].formID ?? (crypto.randomUUID ? crypto.randomUUID() : uuidv4()),
          formState: {
            ...(action.forms[i].initialState || {}),
            file: {
              initialValue: action.forms[i].file,
              valid: true,
              value: action.forms[i].file,
            },
          },
          missingFile: false,
          uploadEdits: {},
        }
      }

      return {
        ...state,
        activeIndex: 0,
        forms: [...newForms, ...state.forms],
      }
    }
    case 'REMOVE_FORM': {
      const remainingFormStates = [...state.forms]
      const [removedForm] = remainingFormStates.splice(action.index, 1)

      const affectedByShift = state.activeIndex >= action.index
      const nextIndex =
        state.activeIndex === action.index
          ? action.index
          : affectedByShift
            ? state.activeIndex - 1
            : state.activeIndex
      const boundedActiveIndex = Math.min(remainingFormStates.length - 1, nextIndex)

      return {
        ...state,
        activeIndex: affectedByShift ? boundedActiveIndex : state.activeIndex,
        forms: remainingFormStates,
        totalErrorCount: state.totalErrorCount - removedForm.errorCount,
      }
    }
    case 'REPLACE': {
      return {
        ...state,
        ...action.state,
      }
    }
    case 'SET_ACTIVE_INDEX': {
      return {
        ...state,
        activeIndex: action.index,
      }
    }
    case 'UPDATE_ERROR_COUNT': {
      const forms = [...state.forms]
      const form = forms[action.index]

      // Clear missingFile flag if the form now has a file
      const hasFile = form.formState?.file?.value
      const missingFile = hasFile ? false : form.missingFile

      const fileErrorCount = (missingFile ? 1 : 0) + (form.exceedsLimit ? 1 : 0)

      forms[action.index] = {
        ...form,
        errorCount: action.count + fileErrorCount,
        missingFile,
      }

      return {
        ...state,
        forms,
        totalErrorCount: forms.reduce((acc, form) => acc + form.errorCount, 0),
      }
    }
    case 'UPDATE_FORM': {
      const updatedForms = [...state.forms]
      updatedForms[action.index].errorCount = action.errorCount

      // Update file error flags if provided, otherwise preserve existing values
      if (action.exceedsLimit !== undefined) {
        updatedForms[action.index].exceedsLimit = action.exceedsLimit
      }
      if (action.missingFile !== undefined) {
        updatedForms[action.index].missingFile = action.missingFile
      }

      // Merge the existing formState with the new formState
      updatedForms[action.index] = {
        ...updatedForms[action.index],
        formState: {
          ...updatedForms[action.index].formState,
          ...action.formState,
        },
        uploadEdits: {
          ...updatedForms[action.index].uploadEdits,
          ...action.uploadEdits,
        },
      }

      return {
        ...state,
        forms: updatedForms,
        totalErrorCount: updatedForms.reduce((acc, form) => acc + form.errorCount, 0),
      }
    }
    default: {
      return state
    }
  }
}
