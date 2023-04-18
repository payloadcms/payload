"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
const react_1 = __importStar(require("react"));
const deep_equal_1 = __importDefault(require("deep-equal"));
const object_to_formdata_1 = require("object-to-formdata");
const react_router_dom_1 = require("react-router-dom");
const react_toastify_1 = require("react-toastify");
const react_i18next_1 = require("react-i18next");
const Auth_1 = require("../../utilities/Auth");
const Locale_1 = require("../../utilities/Locale");
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const api_1 = require("../../../api");
const useThrottledEffect_1 = __importDefault(require("../../../hooks/useThrottledEffect"));
const fieldReducer_1 = __importDefault(require("./fieldReducer"));
const initContextState_1 = __importDefault(require("./initContextState"));
const reduceFieldsToValues_1 = __importDefault(require("./reduceFieldsToValues"));
const getSiblingData_1 = __importDefault(require("./getSiblingData"));
const getDataByPath_1 = __importDefault(require("./getDataByPath"));
const wait_1 = __importDefault(require("../../../../utilities/wait"));
const buildInitialState_1 = __importDefault(require("./buildInitialState"));
const errorMessages_1 = __importDefault(require("./errorMessages"));
const context_1 = require("./context");
const buildStateFromSchema_1 = __importDefault(require("./buildStateFromSchema"));
const OperationProvider_1 = require("../../utilities/OperationProvider");
const baseClass = 'form';
const Form = (props) => {
    const { disabled, onSubmit, method, action, handleResponse, onSuccess, children, className, redirect, disableSuccessStatus, initialState, // fully formed initial field state
    initialData, // values only, paths are required as key - form should build initial state as convenience
    waitForAutocomplete, } = props;
    const history = (0, react_router_dom_1.useHistory)();
    const locale = (0, Locale_1.useLocale)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const { refreshCookie, user } = (0, Auth_1.useAuth)();
    const { id } = (0, DocumentInfo_1.useDocumentInfo)();
    const operation = (0, OperationProvider_1.useOperation)();
    const [modified, setModified] = (0, react_1.useState)(false);
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const [submitted, setSubmitted] = (0, react_1.useState)(false);
    const [formattedInitialData, setFormattedInitialData] = (0, react_1.useState)((0, buildInitialState_1.default)(initialData));
    const formRef = (0, react_1.useRef)(null);
    const contextRef = (0, react_1.useRef)({});
    let initialFieldState = {};
    if (formattedInitialData)
        initialFieldState = formattedInitialData;
    if (initialState)
        initialFieldState = initialState;
    const fieldsReducer = (0, react_1.useReducer)(fieldReducer_1.default, {}, () => initialFieldState);
    const [fields, dispatchFields] = fieldsReducer;
    contextRef.current.fields = fields;
    contextRef.current.dispatchFields = dispatchFields;
    const validateForm = (0, react_1.useCallback)(async () => {
        const validatedFieldState = {};
        let isValid = true;
        const data = contextRef.current.getData();
        const validationPromises = Object.entries(contextRef.current.fields).map(async ([path, field]) => {
            const validatedField = {
                ...field,
                valid: true,
            };
            if (field.passesCondition !== false) {
                let validationResult = true;
                if (typeof field.validate === 'function') {
                    validationResult = await field.validate(field.value, {
                        data,
                        siblingData: contextRef.current.getSiblingData(path),
                        user,
                        id,
                        operation,
                        t,
                    });
                }
                if (typeof validationResult === 'string') {
                    validatedField.errorMessage = validationResult;
                    validatedField.valid = false;
                    isValid = false;
                }
            }
            validatedFieldState[path] = validatedField;
        });
        await Promise.all(validationPromises);
        if (!(0, deep_equal_1.default)(contextRef.current.fields, validatedFieldState)) {
            dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState });
        }
        return isValid;
    }, [contextRef, id, user, operation, t, dispatchFields]);
    const submit = (0, react_1.useCallback)(async (options = {}, e) => {
        const { overrides = {}, action: actionToUse = action, method: methodToUse = method, skipValidation, } = options;
        if (disabled) {
            if (e) {
                e.preventDefault();
            }
            return;
        }
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setProcessing(true);
        if (waitForAutocomplete)
            await (0, wait_1.default)(100);
        const isValid = skipValidation ? true : await contextRef.current.validateForm();
        if (!skipValidation)
            setSubmitted(true);
        // If not valid, prevent submission
        if (!isValid) {
            react_toastify_1.toast.error(t('error:correctInvalidFields'));
            setProcessing(false);
            return;
        }
        // If submit handler comes through via props, run that
        if (onSubmit) {
            const data = {
                ...(0, reduceFieldsToValues_1.default)(fields, true),
                ...overrides,
            };
            onSubmit(fields, data);
        }
        const formData = contextRef.current.createFormData(overrides);
        try {
            const res = await api_1.requests[methodToUse.toLowerCase()](actionToUse, {
                body: formData,
                headers: {
                    'Accept-Language': i18n.language,
                },
            });
            setModified(false);
            if (typeof handleResponse === 'function') {
                handleResponse(res);
                return;
            }
            setProcessing(false);
            const contentType = res.headers.get('content-type');
            const isJSON = contentType && contentType.indexOf('application/json') !== -1;
            let json = {};
            if (isJSON)
                json = await res.json();
            if (res.status < 400) {
                setSubmitted(false);
                if (typeof onSuccess === 'function')
                    onSuccess(json);
                if (redirect) {
                    const destination = {
                        pathname: redirect,
                        state: {},
                    };
                    if (typeof json === 'object' && json.message && !disableSuccessStatus) {
                        destination.state = {
                            status: [
                                {
                                    message: json.message,
                                    type: 'success',
                                },
                            ],
                        };
                    }
                    history.push(destination);
                }
                else if (!disableSuccessStatus) {
                    react_toastify_1.toast.success(json.message || t('submissionSuccessful'), { autoClose: 3000 });
                }
            }
            else {
                contextRef.current = { ...contextRef.current }; // triggers rerender of all components that subscribe to form
                if (json.message) {
                    react_toastify_1.toast.error(json.message);
                    return;
                }
                if (Array.isArray(json.errors)) {
                    const [fieldErrors, nonFieldErrors] = json.errors.reduce(([fieldErrs, nonFieldErrs], err) => {
                        const newFieldErrs = [];
                        const newNonFieldErrs = [];
                        if (err === null || err === void 0 ? void 0 : err.message) {
                            newNonFieldErrs.push(err);
                        }
                        if (Array.isArray(err === null || err === void 0 ? void 0 : err.data)) {
                            err.data.forEach((dataError) => {
                                if (dataError === null || dataError === void 0 ? void 0 : dataError.field) {
                                    newFieldErrs.push(dataError);
                                }
                                else {
                                    newNonFieldErrs.push(dataError);
                                }
                            });
                        }
                        return [
                            [
                                ...fieldErrs,
                                ...newFieldErrs,
                            ],
                            [
                                ...nonFieldErrs,
                                ...newNonFieldErrs,
                            ],
                        ];
                    }, [[], []]);
                    fieldErrors.forEach((err) => {
                        var _a, _b;
                        dispatchFields({
                            type: 'UPDATE',
                            ...(((_b = (_a = contextRef.current) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b[err.field]) || {}),
                            valid: false,
                            errorMessage: err.message,
                            path: err.field,
                        });
                    });
                    nonFieldErrors.forEach((err) => {
                        react_toastify_1.toast.error(err.message || t('error:unknown'));
                    });
                    return;
                }
                const message = errorMessages_1.default[res.status] || t('error:unknown');
                react_toastify_1.toast.error(message);
            }
            return;
        }
        catch (err) {
            setProcessing(false);
            react_toastify_1.toast.error(err);
        }
    }, [
        action,
        disableSuccessStatus,
        disabled,
        dispatchFields,
        fields,
        handleResponse,
        history,
        method,
        onSubmit,
        onSuccess,
        redirect,
        t,
        i18n,
        waitForAutocomplete,
    ]);
    const getFields = (0, react_1.useCallback)(() => contextRef.current.fields, [contextRef]);
    const getField = (0, react_1.useCallback)((path) => contextRef.current.fields[path], [contextRef]);
    const getData = (0, react_1.useCallback)(() => (0, reduceFieldsToValues_1.default)(contextRef.current.fields, true), [contextRef]);
    const getSiblingData = (0, react_1.useCallback)((path) => (0, getSiblingData_1.default)(contextRef.current.fields, path), [contextRef]);
    const getDataByPath = (0, react_1.useCallback)((path) => (0, getDataByPath_1.default)(contextRef.current.fields, path), [contextRef]);
    const createFormData = (0, react_1.useCallback)((overrides = {}) => {
        const data = (0, reduceFieldsToValues_1.default)(contextRef.current.fields, true);
        const file = data === null || data === void 0 ? void 0 : data.file;
        if (file) {
            delete data.file;
        }
        const dataWithOverrides = {
            ...data,
            ...overrides,
        };
        const dataToSerialize = {
            _payload: JSON.stringify(dataWithOverrides),
            file,
        };
        // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
        const formData = (0, object_to_formdata_1.serialize)(dataToSerialize, { indices: true, nullsAsUndefineds: false });
        return formData;
    }, [contextRef]);
    const reset = (0, react_1.useCallback)(async (fieldSchema, data) => {
        const state = await (0, buildStateFromSchema_1.default)({ fieldSchema, data, user, id, operation, locale, t });
        contextRef.current = { ...initContextState_1.default };
        dispatchFields({ type: 'REPLACE_STATE', state });
    }, [id, user, operation, locale, t, dispatchFields]);
    contextRef.current.submit = submit;
    contextRef.current.getFields = getFields;
    contextRef.current.getField = getField;
    contextRef.current.getData = getData;
    contextRef.current.getSiblingData = getSiblingData;
    contextRef.current.getDataByPath = getDataByPath;
    contextRef.current.validateForm = validateForm;
    contextRef.current.createFormData = createFormData;
    contextRef.current.setModified = setModified;
    contextRef.current.setProcessing = setProcessing;
    contextRef.current.setSubmitted = setSubmitted;
    contextRef.current.disabled = disabled;
    contextRef.current.formRef = formRef;
    contextRef.current.reset = reset;
    (0, react_1.useEffect)(() => {
        if (initialState) {
            contextRef.current = { ...initContextState_1.default };
            dispatchFields({ type: 'REPLACE_STATE', state: initialState });
        }
    }, [initialState, dispatchFields]);
    (0, react_1.useEffect)(() => {
        if (initialData) {
            contextRef.current = { ...initContextState_1.default };
            const builtState = (0, buildInitialState_1.default)(initialData);
            setFormattedInitialData(builtState);
            dispatchFields({ type: 'REPLACE_STATE', state: builtState });
        }
    }, [initialData, dispatchFields]);
    (0, useThrottledEffect_1.default)(() => {
        refreshCookie();
    }, 15000, [fields]);
    (0, react_1.useEffect)(() => {
        contextRef.current = { ...contextRef.current }; // triggers rerender of all components that subscribe to form
        setModified(false);
    }, [locale]);
    const classes = [
        className,
        baseClass,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("form", { noValidate: true, onSubmit: (e) => contextRef.current.submit({}, e), method: method, action: action, className: classes, ref: formRef },
        react_1.default.createElement(context_1.FormContext.Provider, { value: contextRef.current },
            react_1.default.createElement(context_1.FormWatchContext.Provider, { value: {
                    fields,
                    ...contextRef.current,
                } },
                react_1.default.createElement(context_1.SubmittedContext.Provider, { value: submitted },
                    react_1.default.createElement(context_1.ProcessingContext.Provider, { value: processing },
                        react_1.default.createElement(context_1.ModifiedContext.Provider, { value: modified },
                            react_1.default.createElement(context_1.FormFieldsContext.Provider, { value: fieldsReducer }, children))))))));
};
exports.default = Form;
//# sourceMappingURL=index.js.map