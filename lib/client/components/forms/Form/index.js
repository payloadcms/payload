"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _reactRouterDom = require("react-router-dom");

var _payload = require("payload");

require("./index.css");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var Form =
/*#__PURE__*/
function (_Component) {
  _inherits(Form, _Component);

  function Form(props) {
    var _this;

    _classCallCheck(this, Form);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Form).call(this, props));
    _this.state = {
      fields: _this.buildFields(),
      status: undefined,
      processing: false
    }; // Fill from renderChildren

    _this.childRefs = {};
    _this.buildFields = _this.buildFields.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.handleChange = _this.handleChange.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.submit = _this.submit.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.renderChildren = _this.renderChildren.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    return _this;
  }

  _createClass(Form, [{
    key: "buildFields",
    value: function buildFields() {
      var fields = {};

      _react.default.Children.map(this.props.children, function (child) {
        if (child.props.name) {
          fields[child.props.name] = {
            value: child.props.value ? child.props.value : '',
            required: child.props.required
          };
        }
      });

      return fields;
    }
  }, {
    key: "handleChange",
    value: function handleChange(e) {
      var newState = _objectSpread({}, this.state);

      newState.fields[e.target.name].value = e.target.value;
      this.setState(newState);
    }
  }, {
    key: "submit",
    value: function submit(e) {
      var _this2 = this;

      var isValid = true;

      var newState = _objectSpread({}, this.state);

      Object.keys(this.childRefs).forEach(function (field) {
        if (_this2.childRefs[field].props.required) {
          var current = _this2.childRefs[field];
          var validated = current.validate();
          newState.fields[field].valid = validated;

          if (!validated) {
            isValid = false;
          }
        }
      }); // Update validated fields

      this.setState(newState); // If not valid, prevent submission

      if (!isValid) {
        e.preventDefault(); // If submit handler comes through via props, run that
      } else if (this.props.onSubmit) {
        e.preventDefault();
        this.props.onSubmit(this.state.fields); // If form is AJAX, fetch data
      } else if (this.props.ajax) {
        e.preventDefault();
        var data = {}; // Clean up data passed from field state

        Object.keys(this.state.fields).forEach(function (field) {
          data[field] = _this2.state.fields[field].value;
        });
        this.setState({
          processing: true
        }); // Make the API call from the action

        _payload.ajax.requests[this.props.method](this.props.action, data).then(function (res) {
          // Provide form data to the redirected page
          if (_this2.props.redirect) {
            _this2.props.history.push(_this2.props.redirect, data);
          } else {
            _this2.setState({
              status: {
                message: res.msg,
                type: 'success'
              },
              processing: false
            });
          }
        }, function (error) {
          console.log(error);

          _this2.setState({
            status: {
              message: 'Sorry, there was a problem with your request.',
              type: 'error'
            },
            processing: false
          });
        });
      }

      if (this.props.clearAfterSubmit && isValid) {
        // Loop through fields - if not valid, set to invalid, rerender with error
        Object.keys(this.state.fields).forEach(function (field) {
          newState.fields[field].value = '';
        });
      } // If valid and not AJAX submit as usual


      return;
    }
  }, {
    key: "renderChildren",
    value: function renderChildren() {
      var _this3 = this;

      var children = _react.default.Children.map(this.props.children, function (child) {
        if (child.props.name) {
          // Initialize validation as true - only show error class if error after blur
          var valid = true; // If a valid value has been passed from field, set valid equal to that

          if (typeof _this3.state.fields[child.props.name].valid !== 'undefined') {
            valid = _this3.state.fields[child.props.name].valid;
          }

          return _react.default.cloneElement(child, {
            ref: function ref(el) {
              _this3.childRefs[child.props.name] = el;
            },
            change: _this3.handleChange,
            validate: _this3.validate,
            valid: valid,
            value: _this3.state.fields[child.props.name].value
          });
        }

        if (child.props.type === 'submit') {
          return _react.default.cloneElement(child, {
            disabled: _this3.state.processing || child.props.disabled === 'disabled' ? 'disabled' : false,
            children: _this3.state.processing ? 'Processing...' : child.props.children
          });
        }

        return child;
      });

      return children;
    }
  }, {
    key: "render",
    value: function render() {
      var _this4 = this;

      var Status = function Status() {
        return null;
      };

      if (this.state.status && !this.state.redirect) {
        Status = function Status() {
          return _react.default.createElement("div", {
            className: "status open ".concat(_this4.state.status.type)
          }, _this4.state.status.message);
        };
      }

      return _react.default.createElement("form", {
        onSubmit: this.submit,
        method: this.props.method,
        action: this.props.action,
        className: this.props.className
      }, _react.default.createElement(Status, null), this.renderChildren());
    }
  }]);

  return Form;
}(_react.Component);

var _default = (0, _reactRouterDom.withRouter)(Form);

exports.default = _default;
//# sourceMappingURL=index.js.map