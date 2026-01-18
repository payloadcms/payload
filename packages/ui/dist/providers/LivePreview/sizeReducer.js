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
export const sizeReducer = (state, action) => {
  switch (action.type) {
    case 'height':
      return {
        ...state,
        height: action.value
      };
    case 'width':
      return {
        ...state,
        width: action.value
      };
    default:
      return {
        ...state,
        ...(action?.value || {})
      };
  }
};
//# sourceMappingURL=sizeReducer.js.map