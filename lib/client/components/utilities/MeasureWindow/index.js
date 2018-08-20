"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = require("react");

var _reactRedux = require("react-redux");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var mapStateToProps = function mapStateToProps(state) {
  return {
    windowWidth: state.common.windowWidth,
    windowHeight: state.common.windowHeight
  };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    setWindowSize: function setWindowSize(size) {
      return dispatch({
        type: 'SET_WINDOW_SIZE',
        payload: size
      });
    }
  };
};

var MeasureWindow =
/*#__PURE__*/
function (_Component) {
  _inherits(MeasureWindow, _Component);

  function MeasureWindow() {
    var _this;

    _classCallCheck(this, MeasureWindow);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(MeasureWindow).call(this));
    _this.setSize = _this.setSize.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.onResize = _this.onResize.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    return _this;
  }

  _createClass(MeasureWindow, [{
    key: "setSize",
    value: function setSize() {
      this.props.setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, {
    key: "onResize",
    value: function onResize() {
      // Only resize on screens larger than mobile
      // To avoid toolbars hiding and orientation change
      var mobileWidth = 450;

      if (window.innerWidth > mobileWidth) {
        this.setSize();
      }
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      window.addEventListener('resize', this.onResize);
      window.addEventListener('orientationchange', function () {
        var delay = 500;
        setTimeout(function () {
          _this2.setSize();
        }, delay);
      });
      this.setSize();
    }
  }, {
    key: "render",
    value: function render() {
      return false;
    }
  }]);

  return MeasureWindow;
}(_react.Component);

var _default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(MeasureWindow);

exports.default = _default;
//# sourceMappingURL=index.js.map