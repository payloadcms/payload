"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_i18next_1 = require("react-i18next");
const Auth_1 = require("../../utilities/Auth");
const context_1 = require("../Form/context");
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const OperationProvider_1 = require("../../utilities/OperationProvider");
const useThrottledEffect_1 = __importDefault(require("../../../hooks/useThrottledEffect"));
/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/hooks#usefield
 */
const useField = (options) => {
    const { path, validate, disableFormData = false, condition, } = options;
    const submitted = (0, context_1.useFormSubmitted)();
    const processing = (0, context_1.useFormProcessing)();
    const modified = (0, context_1.useFormModified)();
    const { user } = (0, Auth_1.useAuth)();
    const { id } = (0, DocumentInfo_1.useDocumentInfo)();
    const operation = (0, OperationProvider_1.useOperation)();
    const field = (0, context_1.useFormFields)(([fields]) => fields[path]);
    const dispatchField = (0, context_1.useFormFields)(([_, dispatch]) => dispatch);
    const { t } = (0, react_i18next_1.useTranslation)();
    const { getData, getSiblingData, setModified } = (0, context_1.useForm)();
    const value = field === null || field === void 0 ? void 0 : field.value;
    const initialValue = field === null || field === void 0 ? void 0 : field.initialValue;
    const valid = typeof (field === null || field === void 0 ? void 0 : field.valid) === 'boolean' ? field.valid : true;
    const showError = valid === false && submitted;
    // Method to return from `useField`, used to
    // update field values from field component(s)
    const setValue = (0, react_1.useCallback)((e, disableModifyingForm = false) => {
        const val = (e && e.target) ? e.target.value : e;
        if (!modified && !disableModifyingForm) {
            if (typeof setModified === 'function') {
                // Update modified state after field value comes back
                // to avoid cursor jump caused by state value / DOM mismatch
                setTimeout(() => {
                    setModified(true);
                }, 10);
            }
        }
        dispatchField({
            type: 'UPDATE',
            path,
            value: val,
            disableFormData,
        });
    }, [
        setModified,
        modified,
        path,
        dispatchField,
        disableFormData,
    ]);
    // Store result from hook as ref
    // to prevent unnecessary rerenders
    const result = (0, react_1.useMemo)(() => ({
        showError,
        errorMessage: field === null || field === void 0 ? void 0 : field.errorMessage,
        value,
        formSubmitted: submitted,
        formProcessing: processing,
        setValue,
        initialValue,
    }), [field, processing, setValue, showError, submitted, value, initialValue]);
    // Throttle the validate function
    (0, useThrottledEffect_1.default)(() => {
        const validateField = async () => {
            const action = {
                type: 'UPDATE',
                path,
                disableFormData,
                validate,
                condition,
                value,
                valid: false,
                errorMessage: undefined,
            };
            const validateOptions = {
                id,
                user,
                data: getData(),
                siblingData: getSiblingData(path),
                operation,
                t,
            };
            const validationResult = typeof validate === 'function' ? await validate(value, validateOptions) : true;
            if (typeof validationResult === 'string') {
                action.errorMessage = validationResult;
                action.valid = false;
            }
            else {
                action.valid = validationResult;
                action.errorMessage = undefined;
            }
            if (typeof dispatchField === 'function') {
                dispatchField(action);
            }
        };
        validateField();
    }, 150, [
        value,
        condition,
        disableFormData,
        dispatchField,
        getData,
        getSiblingData,
        id,
        operation,
        path,
        user,
        validate,
    ]);
    return result;
};
exports.default = useField;
//# sourceMappingURL=index.js.map