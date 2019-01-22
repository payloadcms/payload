const defaultState = {
  menuStatus: false,
  scrollPos: 0,
  windowWidth: 1400,
  windowHeight: 900,
  viewWidth: false,
  viewHeight: false,
  modalState: false,
  stepNav: [],
  locale: null,
  config: null,
  collections: null,
  searchParams: null
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case 'TOGGLE_MENU':
      return {
        ...state,
        menuStatus: !state.menuStatus
      };

    case 'UPDATE_SCROLL':

      return {
        ...state,
        scrollPos: action.payload
      };

    case 'SET_WINDOW_SIZE':

      return {
        ...state,
        windowWidth: action.payload.width,
        windowHeight: action.payload.height
      };

    case 'SET_VIEW_SIZE':

      return {
        ...state,
        viewWidth: action.payload.width,
        viewHeight: action.payload.height
      };

    case 'SET_MODAL':

      return {
        ...state,
        modalStatus: action.payload
      };

    case 'SET_STEP_NAV':

      return {
        ...state,
        stepNav: action.payload
      };

    case 'LOAD_GLOBALS':

      return {
        ...state,
        config: action.payload.config,
        collections: action.payload.collections
      };

    case 'SET_LOCALE':
      console.log(action.payload);
      return {
        ...state,
        locale: action.payload
      }

    case 'SET_SEARCH_PARAMS':
      return {
        ...state,
        searchParams: action.payload
      }

    default:
    //
  }

  return state;
};
