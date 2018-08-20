"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _components = require("payload/components");

require("./index.css");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var Input =
/*#__PURE__*/
function (_Component) {
  _inherits(Input, _Component);

  function Input() {
    var _this;

    _classCallCheck(this, Input);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Input).call(this));
    _this.errors = {
      text: 'Please fill in the field',
      email: 'Please enter a valid email'
    };
    _this.validate = _this.validate.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    return _this;
  }

  _createClass(Input, [{
    key: "validate",
    value: function validate() {
      var emailTest = /\S+@\S+\.\S+/;

      switch (this.props.type) {
        case 'text':
          return this.el.value.length > 0;

        case 'password':
          return this.el.value.length > 0;

        case 'email':
          return emailTest.test(this.el.value);

        case 'hidden':
          return true;

        default:
          return false;
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      if (this.props.autoFocus) {
        this.el.focus();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var Required = this.props.required ? function () {
        return _react.default.createElement("span", {
          className: "required"
        }, "*");
      } : function () {
        return null;
      };
      var Error = this.props.valid === false ? function () {
        return _react.default.createElement(_components.Tooltip, {
          className: "error-message"
        }, _this2.errors[_this2.props.type]);
      } : function () {
        return null;
      };
      var Label = this.props.label ? function () {
        return _react.default.createElement("label", {
          htmlFor: _this2.props.id ? _this2.props.id : _this2.props.name
        }, _this2.props.label, _react.default.createElement(Required, null));
      } : function () {
        return null;
      };
      var className = "interact ".concat(this.props.type);
      className = this.props.valid !== false ? className : "".concat(className, " error");
      return _react.default.createElement("div", {
        className: className,
        style: this.props.style
      }, _react.default.createElement(Error, null), _react.default.createElement(Label, null), _react.default.createElement("input", {
        ref: function ref(el) {
          _this2.el = el;
        },
        disabled: this.props.disabled,
        placeholder: this.props.placeholder,
        onChange: this.props.change,
        onFocus: this.props.onFocus,
        type: this.props.type,
        id: this.props.id ? this.props.id : this.props.name,
        name: this.props.name,
        value: this.props.value
      }));
    }
  }]);

  return Input;
}(_react.Component);

var _default = Input;
exports.default = _default;
//# sourceMappingURL=index.js.map