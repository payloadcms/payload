"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    Form: function() {
        return _Form.default;
    },
    useAllFormFields: function() {
        return _context.useAllFormFields;
    },
    useForm: function() {
        return _context.useForm;
    },
    useFormFields: function() {
        return _context.useFormFields;
    },
    useFormModified: function() {
        return _context.useFormModified;
    },
    useFormProcessing: function() {
        return _context.useFormProcessing;
    },
    useFormSubmitted: function() {
        return _context.useFormSubmitted;
    },
    /**
   * @deprecated useWatchForm is no longer preferred. If you need all form fields, prefer `useAllFormFields`.
   */ useWatchForm: function() {
        return _context.useWatchForm;
    },
    getSiblingData: function() {
        return _getSiblingData.default;
    },
    reduceFieldsToValues: function() {
        return _reduceFieldsToValues.default;
    },
    Label: function() {
        return _Label.default;
    },
    Submit: function() {
        return _Submit.default;
    },
    Checkbox: function() {
        return _Checkbox.default;
    },
    Group: function() {
        return _Group.default;
    },
    Select: function() {
        return _Select.default;
    },
    SelectInput: function() {
        return _Input.default;
    },
    Text: function() {
        return _Text.default;
    },
    TextInput: function() {
        return _Input1.default;
    },
    useFieldType: function() {
        return _useField.default;
    },
    useField: function() {
        return _useField.default;
    },
    withCondition: function() {
        return _withCondition.default;
    }
});
const _Form = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/Form"));
const _context = require("../dist/admin/components/forms/Form/context");
const _getSiblingData = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/Form/getSiblingData"));
const _reduceFieldsToValues = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/Form/reduceFieldsToValues"));
const _Label = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/Label"));
const _Submit = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/Submit"));
const _Checkbox = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/field-types/Checkbox"));
const _Group = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/field-types/Group"));
const _Select = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/field-types/Select"));
const _Input = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/field-types/Select/Input"));
const _Text = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/field-types/Text"));
const _Input1 = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/field-types/Text/Input"));
const _useField = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/useField"));
const _withCondition = /*#__PURE__*/ _interop_require_default(require("../dist/admin/components/forms/withCondition"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9leHBvcnRzL2NvbXBvbmVudHMvZm9ybXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgZGVmYXVsdCBhcyBGb3JtIH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy9mb3Jtcy9Gb3JtJ1xuXG5leHBvcnQge1xuICB1c2VBbGxGb3JtRmllbGRzLFxuICB1c2VGb3JtLFxuICB1c2VGb3JtRmllbGRzLFxuICB1c2VGb3JtTW9kaWZpZWQsXG4gIHVzZUZvcm1Qcm9jZXNzaW5nLFxuICB1c2VGb3JtU3VibWl0dGVkLFxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgdXNlV2F0Y2hGb3JtIGlzIG5vIGxvbmdlciBwcmVmZXJyZWQuIElmIHlvdSBuZWVkIGFsbCBmb3JtIGZpZWxkcywgcHJlZmVyIGB1c2VBbGxGb3JtRmllbGRzYC5cbiAgICovXG4gIHVzZVdhdGNoRm9ybSxcbn0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy9mb3Jtcy9Gb3JtL2NvbnRleHQnXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgZ2V0U2libGluZ0RhdGEgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL0Zvcm0vZ2V0U2libGluZ0RhdGEnXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgcmVkdWNlRmllbGRzVG9WYWx1ZXMgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL0Zvcm0vcmVkdWNlRmllbGRzVG9WYWx1ZXMnXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgTGFiZWwgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL0xhYmVsJ1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBTdWJtaXQgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL1N1Ym1pdCdcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBDaGVja2JveCB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvZm9ybXMvZmllbGQtdHlwZXMvQ2hlY2tib3gnXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgR3JvdXAgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL2ZpZWxkLXR5cGVzL0dyb3VwJ1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBTZWxlY3QgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL2ZpZWxkLXR5cGVzL1NlbGVjdCdcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBTZWxlY3RJbnB1dCB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvZm9ybXMvZmllbGQtdHlwZXMvU2VsZWN0L0lucHV0J1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBUZXh0IH0gZnJvbSAnLi4vLi4vYWRtaW4vY29tcG9uZW50cy9mb3Jtcy9maWVsZC10eXBlcy9UZXh0J1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBUZXh0SW5wdXQgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL2ZpZWxkLXR5cGVzL1RleHQvSW5wdXQnXG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVGhpcyBtZXRob2QgaXMgbm93IGNhbGxlZCB1c2VGaWVsZC4gVGhlIHVzZUZpZWxkVHlwZSBhbGlhcyB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IHsgZGVmYXVsdCBhcyB1c2VGaWVsZFR5cGUgfSBmcm9tICcuLi8uLi9hZG1pbi9jb21wb25lbnRzL2Zvcm1zL3VzZUZpZWxkJ1xuZXhwb3J0IHsgZGVmYXVsdCBhcyB1c2VGaWVsZCB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvZm9ybXMvdXNlRmllbGQnXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgd2l0aENvbmRpdGlvbiB9IGZyb20gJy4uLy4uL2FkbWluL2NvbXBvbmVudHMvZm9ybXMvd2l0aENvbmRpdGlvbidcbiJdLCJuYW1lcyI6WyJGb3JtIiwidXNlQWxsRm9ybUZpZWxkcyIsInVzZUZvcm0iLCJ1c2VGb3JtRmllbGRzIiwidXNlRm9ybU1vZGlmaWVkIiwidXNlRm9ybVByb2Nlc3NpbmciLCJ1c2VGb3JtU3VibWl0dGVkIiwidXNlV2F0Y2hGb3JtIiwiZ2V0U2libGluZ0RhdGEiLCJyZWR1Y2VGaWVsZHNUb1ZhbHVlcyIsIkxhYmVsIiwiU3VibWl0IiwiQ2hlY2tib3giLCJHcm91cCIsIlNlbGVjdCIsIlNlbGVjdElucHV0IiwiVGV4dCIsIlRleHRJbnB1dCIsInVzZUZpZWxkVHlwZSIsInVzZUZpZWxkIiwid2l0aENvbmRpdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBb0JBLElBQUk7ZUFBSkEsYUFBSTs7SUFHdEJDLGdCQUFnQjtlQUFoQkEseUJBQWdCOztJQUNoQkMsT0FBTztlQUFQQSxnQkFBTzs7SUFDUEMsYUFBYTtlQUFiQSxzQkFBYTs7SUFDYkMsZUFBZTtlQUFmQSx3QkFBZTs7SUFDZkMsaUJBQWlCO2VBQWpCQSwwQkFBaUI7O0lBQ2pCQyxnQkFBZ0I7ZUFBaEJBLHlCQUFnQjs7SUFDaEI7O0dBRUMsR0FDREMsWUFBWTtlQUFaQSxxQkFBWTs7SUFHTUMsY0FBYztlQUFkQSx1QkFBYzs7SUFFZEMsb0JBQW9CO2VBQXBCQSw2QkFBb0I7O0lBRXBCQyxLQUFLO2VBQUxBLGNBQUs7O0lBQ0xDLE1BQU07ZUFBTkEsZUFBTTs7SUFFTkMsUUFBUTtlQUFSQSxpQkFBUTs7SUFFUkMsS0FBSztlQUFMQSxjQUFLOztJQUNMQyxNQUFNO2VBQU5BLGVBQU07O0lBRU5DLFdBQVc7ZUFBWEEsY0FBVzs7SUFDWEMsSUFBSTtlQUFKQSxhQUFJOztJQUNKQyxTQUFTO2VBQVRBLGVBQVM7O0lBS1RDLFlBQVk7ZUFBWkEsaUJBQVk7O0lBQ1pDLFFBQVE7ZUFBUkEsaUJBQVE7O0lBRVJDLGFBQWE7ZUFBYkEsc0JBQWE7Ozs2REFyQ0Q7eUJBYXpCO3VFQUVtQzs2RUFFTTs4REFFZjsrREFDQztpRUFFRTs4REFFSDsrREFDQzs4REFFSzs2REFDUDsrREFDSztpRUFLRztzRUFHQyJ9