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
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const useField_1 = __importDefault(require("../../../../forms/useField"));
const Button_1 = __importDefault(require("../../../../elements/Button"));
const FileDetails_1 = __importDefault(require("../../../../elements/FileDetails"));
const Error_1 = __importDefault(require("../../../../forms/Error"));
const reduceFieldsToValues_1 = __importDefault(require("../../../../forms/Form/reduceFieldsToValues"));
require("./index.scss");
const baseClass = 'file-field';
const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
};
const validate = (value) => {
    if (!value && value !== undefined) {
        return 'A file is required.';
    }
    return true;
};
const Upload = (props) => {
    var _a, _b;
    const { collection, internalState, } = props;
    const inputRef = (0, react_1.useRef)(null);
    const dropRef = (0, react_1.useRef)(null);
    const [selectingFile, setSelectingFile] = (0, react_1.useState)(false);
    const [dragging, setDragging] = (0, react_1.useState)(false);
    const [dragCounter, setDragCounter] = (0, react_1.useState)(0);
    const [replacingFile, setReplacingFile] = (0, react_1.useState)(false);
    const { t } = (0, react_i18next_1.useTranslation)('upload');
    const [doc, setDoc] = (0, react_1.useState)((0, reduceFieldsToValues_1.default)(internalState || {}, true));
    const { value, setValue, showError, errorMessage, } = (0, useField_1.default)({
        path: 'file',
        validate,
    });
    const handleDragIn = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter((count) => count + 1);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setDragging(true);
        }
    }, []);
    const handleDragOut = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter((count) => count - 1);
        if (dragCounter > 1)
            return;
        setDragging(false);
    }, [dragCounter]);
    const handleDrop = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setValue(e.dataTransfer.files[0]);
            setDragging(false);
            e.dataTransfer.clearData();
            setDragCounter(0);
        }
        else {
            setDragging(false);
        }
    }, [setValue]);
    // Only called when input is interacted with directly
    // Not called when drag + drop is used
    // Or when input is cleared
    const handleInputChange = (0, react_1.useCallback)(() => {
        var _a, _b;
        setSelectingFile(false);
        setValue(((_b = (_a = inputRef === null || inputRef === void 0 ? void 0 : inputRef.current) === null || _a === void 0 ? void 0 : _a.files) === null || _b === void 0 ? void 0 : _b[0]) || null);
    }, [inputRef, setValue]);
    (0, react_1.useEffect)(() => {
        if (selectingFile) {
            inputRef.current.click();
            setSelectingFile(false);
        }
    }, [selectingFile, inputRef, setSelectingFile]);
    (0, react_1.useEffect)(() => {
        setDoc((0, reduceFieldsToValues_1.default)(internalState || {}, true));
        setReplacingFile(false);
    }, [internalState]);
    (0, react_1.useEffect)(() => {
        const div = dropRef.current;
        if (div) {
            div.addEventListener('dragenter', handleDragIn);
            div.addEventListener('dragleave', handleDragOut);
            div.addEventListener('dragover', handleDrag);
            div.addEventListener('drop', handleDrop);
            return () => {
                div.removeEventListener('dragenter', handleDragIn);
                div.removeEventListener('dragleave', handleDragOut);
                div.removeEventListener('dragover', handleDrag);
                div.removeEventListener('drop', handleDrop);
            };
        }
        return () => null;
    }, [handleDragIn, handleDragOut, handleDrop, value]);
    const classes = [
        baseClass,
        dragging && `${baseClass}--dragging`,
        'field-type',
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes },
        react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage }),
        (doc.filename && !replacingFile) && (react_1.default.createElement(FileDetails_1.default, { doc: doc, collection: collection, handleRemove: () => {
                setReplacingFile(true);
                setValue(null);
            } })),
        (!doc.filename || replacingFile) && (react_1.default.createElement("div", { className: `${baseClass}__upload` },
            value && (react_1.default.createElement("div", { className: `${baseClass}__file-selected` },
                react_1.default.createElement("span", { className: `${baseClass}__filename` }, value.name),
                react_1.default.createElement(Button_1.default, { icon: "x", round: true, buttonStyle: "icon-label", iconStyle: "with-border", onClick: () => {
                        setValue(null);
                        inputRef.current.value = null;
                    } }))),
            !value && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: `${baseClass}__drop-zone`, ref: dropRef, onPaste: (e) => {
                        var _a;
                        if ((_a = e === null || e === void 0 ? void 0 : e.clipboardData) === null || _a === void 0 ? void 0 : _a.files.length) {
                            const fileObject = e.clipboardData.files[0];
                            if (fileObject)
                                setValue(fileObject);
                        }
                    } },
                    react_1.default.createElement(Button_1.default, { size: "small", buttonStyle: "secondary", onClick: () => setSelectingFile(true), className: `${baseClass}__file-button` }, t('selectFile')),
                    react_1.default.createElement("p", { className: `${baseClass}__drag-label` },
                        t('general:or'),
                        ' ',
                        t('dragAndDrop'))))),
            react_1.default.createElement("input", { ref: inputRef, type: "file", accept: (_b = (_a = collection === null || collection === void 0 ? void 0 : collection.upload) === null || _a === void 0 ? void 0 : _a.mimeTypes) === null || _b === void 0 ? void 0 : _b.join(','), onChange: handleInputChange })))));
};
exports.default = Upload;
//# sourceMappingURL=index.js.map