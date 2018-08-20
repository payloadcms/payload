"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var defaultState = {
  menuStatus: false,
  scrollPos: 0,
  windowWidth: 1400,
  windowHeight: 900,
  viewWidth: false,
  viewHeight: false,
  modalState: false,
  stepNav: []
};

var _default = function _default() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case 'TOGGLE_MENU':
      return _objectSpread({}, state, {
        menuStatus: !state.menuStatus
      });

    case 'UPDATE_SCROLL':
      return _objectSpread({}, state, {
        scrollPos: action.payload
      });

    case 'SET_WINDOW_SIZE':
      return _objectSpread({}, state, {
        windowWidth: action.payload.width,
        windowHeight: action.payload.height
      });

    case 'SET_VIEW_SIZE':
      return _objectSpread({}, state, {
        viewWidth: action.payload.width,
        viewHeight: action.payload.height
      });

    case 'SET_MODAL':
      return _objectSpread({}, state, {
        modalStatus: action.payload
      });

    case 'SET_STEP_NAV':
      return _objectSpread({}, state, {
        stepNav: action.payload
      });

    default: //

  }

  return state;
};

exports.default = _default;
//# sourceMappingURL=common.js.map