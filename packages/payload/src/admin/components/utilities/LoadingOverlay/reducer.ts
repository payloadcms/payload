import { Action, State } from './types';

export const defaultLoadingOverlayState = {
  isLoading: false,
  overlayType: null,
  loaders: [],
  loadingText: '',
};

export const reducer = (state: State, action: Action): State => {
  const loadersCopy = [...state.loaders];
  const { type = 'fullscreen', key = 'user', loadingText } = action.payload;

  if (action.type === 'add') {
    loadersCopy.push({ type, key, loadingText });
  } else if (action.type === 'remove') {
    const index = loadersCopy.findIndex((item) => item.key === key && item.type === type);
    loadersCopy.splice(index, 1);
  }

  const nextLoader = loadersCopy?.length > 0 ? loadersCopy[loadersCopy.length - 1] : null;

  return {
    isLoading: Boolean(nextLoader),
    overlayType: nextLoader?.type || state?.overlayType,
    loaders: loadersCopy,
    loadingText: nextLoader?.loadingText || state?.loadingText,
  };
};
