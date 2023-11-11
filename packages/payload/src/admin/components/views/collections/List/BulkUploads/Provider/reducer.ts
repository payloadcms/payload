type FormData = {
  [key: string]: any
}
export type Action =
  | {
      formData: FormData
      index: number
      type: 'REPLACE_FORM_DATA'
    }
  | {
      formData: FormData
      type: 'ADD_FORM_DATA'
    }
  | {
      index: number
      type: 'REMOVE_FORM_DATA'
    }
  | {
      index: number
      type: 'SET_ACTIVE_INDEX'
    }
  | {
      isProcessing: boolean
      type: 'SET_IS_PROCESSING'
    }
  | {
      state: FormData[]
      type: 'SET_ALL_FORM_DATA'
    }

export type State = {
  activeIndex: number
  allFormData: FormData[]
  isProcessing: boolean
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_FORM_DATA': {
      return {
        ...state,
        allFormData: [...state.allFormData, action.formData],
      }
    }

    case 'REMOVE_FORM_DATA': {
      const allFormData = state.allFormData.filter((_, index) => index !== action.index)

      return {
        ...state,
        allFormData,
      }
    }

    case 'REPLACE_FORM_DATA': {
      state.allFormData[state.activeIndex] = action.formData
      return { ...state }
    }

    case 'SET_ALL_FORM_DATA': {
      return {
        ...state,
        allFormData: action.state,
      }
    }

    case 'SET_IS_PROCESSING': {
      return {
        ...state,
        isProcessing: action.isProcessing,
      }
    }

    case 'SET_ACTIVE_INDEX': {
      state.activeIndex = action.index
      return { ...state }
    }

    default: {
      return state
    }
  }
}
