import { Action, State } from './types';

export const defaultLoadingOverlayState = {
  isLoading: false,
  overlayType: null,
  loaders: [],
};

// react reducer return type
export const reducer = (state: State, action: Action) => {
  const loadersCopy = [...state.loaders];
  const { type = 'fullscreen', key = 'user' } = action.payload;

  if (action.type === 'add') {
    loadersCopy.push({ type, key });
  } else if (action.type === 'remove') {
    const index = loadersCopy.findIndex((item) => item.key === key && item.type === type);
    loadersCopy.splice(index, 1);
  }

  return {
    isLoading: loadersCopy.length > 0,
    overlayType: loadersCopy.length > 0 ? loadersCopy[loadersCopy.length - 1].type : state?.overlayType,
    loaders: loadersCopy,
  };
};
