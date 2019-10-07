const defaultState = {
  scrollPos: 0,
  windowWidth: 1400,
  windowHeight: 900,
  viewWidth: false,
  viewHeight: false,
  stepNav: [],
  locale: null,
  config: null,
  searchParams: {},
  status: []
};

export default (state = defaultState, action) => {
  switch (action.type) {

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

    case 'SET_STEP_NAV':

      return {
        ...state,
        stepNav: action.payload
      };

    case 'LOAD_CONFIG':

      return {
        ...state,
        config: action.payload
      };

    case 'SET_LOCALE':
      return {
        ...state,
        locale: action.payload
      }

    case 'SET_SEARCH_PARAMS':
      return {
        ...state,
        searchParams: action.payload
      }

    case 'ADD_STATUS':
      return {
        ...state,
        status: [
          action.payload,
          ...state.status
        ]
      };

    case 'REMOVE_STATUS': {
      const newStatus = [...state.status];
      newStatus.splice(action.payload, 1);
      return {
        ...state,
        status: newStatus
      };
    }

    default:
    //
  }

  return state;
};
