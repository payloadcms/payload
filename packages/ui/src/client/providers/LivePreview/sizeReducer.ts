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
  height: number
  width: number
}

export type SizeReducerAction =
  | {
      type: 'height' | 'width'
      value: number
    }
  | {
      type: 'reset'
      value: {
        height: number
        width: number
      }
    }

export const sizeReducer = (state: SizeReducerState, action: SizeReducerAction) => {
  switch (action.type) {
    case 'height':
      return { ...state, height: action.value }
    case 'width':
      return { ...state, width: action.value }
    default:
      return { ...state, ...(action?.value || {}) }
  }
}
