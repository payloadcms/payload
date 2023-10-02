// export const sizeReducer: (state, action) => {
//   switch (action.type) {
//     case 'width':
//       return { ...state, width: action.value }
//     case 'height':
//       return { ...state, height: action.value }
//     default:
//       return { ...state, ...(action?.value || {}) }
//   }
// },

type SizeReducerState = {
  width: number
  height: number
}

export type SizeReducerAction =
  | {
      type: 'width' | 'height'
      value: number
    }
  | {
      type: 'reset'
      value: {
        width: number
        height: number
      }
    }

export const sizeReducer = (state: SizeReducerState, action: SizeReducerAction) => {
  switch (action.type) {
    case 'width':
      return { ...state, width: action.value }
    case 'height':
      return { ...state, height: action.value }
    default:
      return { ...state, ...(action?.value || {}) }
  }
}
