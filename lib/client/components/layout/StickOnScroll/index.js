"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _reactRedux = require("react-redux");

require("./index.css");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var mapStateToProps = function mapStateToProps(state) {
  return {
    scrollPos: state.common.scrollPos
  };
};

var StickOnScroll =
/*#__PURE__*/
function (_Component) {
  _inherits(StickOnScroll, _Component);

  function StickOnScroll(props) {
    var _this;

    _classCallCheck(this, StickOnScroll);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(StickOnScroll).call(this, props));
    _this.state = {
      bounds: false,
      stuck: false
    };
    return _this;
  }

  _createClass(StickOnScroll, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.setState({
        bounds: this.stick.getBoundingClientRect()
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      var newBounds = this.spacer.getBoundingClientRect();

      if (newBounds.top <= 0 && !prevState.stuck) {
        this.setState({
          stuck: true
        });
      }

      if (newBounds.top >= 0 && prevState.stuck) {
        this.setState({
          stuck: false
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      return _react.default.createElement("div", {
        className: "stick-on-scroll"
      }, _react.default.createElement("div", {
        className: "stick".concat(this.state.stuck ? ' stuck' : ''),
        ref: function ref(el) {
          _this2.stick = el;
        }
      }, _react.default.createElement("div", {
        className: "wrap"
      }, this.props.children)), _react.default.createElement("div", {
        className: "spacer",
        style: {
          height: "".concat(this.state.bounds.height, "px")
        },
        ref: function ref(el) {
          _this2.spacer = el;
        }
      }));
    }
  }]);

  return StickOnScroll;
}(_react.Component);

var _default = (0, _reactRedux.connect)(mapStateToProps)(StickOnScroll);

exports.default = _default;
//# sourceMappingURL=index.js.map