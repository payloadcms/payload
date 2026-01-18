'use client';

export const defaultLoadingOverlayState = {
  isLoading: false,
  loaders: [],
  loadingText: '',
  overlayType: null
};
export const reducer = (state, action) => {
  const loadersCopy = [...state.loaders];
  const {
    type = 'fullscreen',
    key = 'user',
    loadingText
  } = action.payload;
  if (action.type === 'add') {
    loadersCopy.push({
      type,
      key,
      loadingText
    });
  } else if (action.type === 'remove') {
    const index = loadersCopy.findIndex(item => item.key === key && item.type === type);
    loadersCopy.splice(index, 1);
  }
  const nextLoader = loadersCopy?.length > 0 ? loadersCopy[loadersCopy.length - 1] : null;
  return {
    isLoading: Boolean(nextLoader),
    loaders: loadersCopy,
    loadingText: nextLoader?.loadingText || state?.loadingText,
    overlayType: nextLoader?.type || state?.overlayType
  };
};
//# sourceMappingURL=reducer.js.map