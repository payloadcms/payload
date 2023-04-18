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
const Label_1 = __importDefault(require("../../Label"));
const Error_1 = __importDefault(require("../../Error"));
const FileDetails_1 = __importDefault(require("../../../elements/FileDetails"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const DocumentDrawer_1 = require("../../../elements/DocumentDrawer");
const ListDrawer_1 = require("../../../elements/ListDrawer");
const Button_1 = __importDefault(require("../../../elements/Button"));
const GetFilterOptions_1 = require("../../../utilities/GetFilterOptions");
require("./index.scss");
const baseClass = 'upload';
const UploadInput = (props) => {
    const { path, required, readOnly, style, className, width, description, label, relationTo, value, onChange, showError, serverURL = 'http://localhost:3000', api = '/api', collection, errorMessage, filterOptions, } = props;
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    const [file, setFile] = (0, react_1.useState)(undefined);
    const [missingFile, setMissingFile] = (0, react_1.useState)(false);
    const [collectionSlugs] = (0, react_1.useState)([collection === null || collection === void 0 ? void 0 : collection.slug]);
    const [filterOptionsResult, setFilterOptionsResult] = (0, react_1.useState)();
    const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, },] = (0, DocumentDrawer_1.useDocumentDrawer)({
        collectionSlug: collectionSlugs[0],
    });
    const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer, },] = (0, ListDrawer_1.useListDrawer)({
        collectionSlugs,
        filterOptions: filterOptionsResult,
    });
    const classes = [
        'field-type',
        baseClass,
        className,
        showError && 'error',
        readOnly && 'read-only',
    ].filter(Boolean).join(' ');
    (0, react_1.useEffect)(() => {
        if (typeof value === 'string' && value !== '') {
            const fetchFile = async () => {
                const response = await fetch(`${serverURL}${api}/${relationTo}/${value}`, {
                    credentials: 'include',
                    headers: {
                        'Accept-Language': i18n.language,
                    },
                });
                if (response.ok) {
                    const json = await response.json();
                    setFile(json);
                }
                else {
                    setMissingFile(true);
                    setFile(undefined);
                }
            };
            fetchFile();
        }
        else {
            setFile(undefined);
        }
    }, [
        value,
        relationTo,
        api,
        serverURL,
        i18n,
    ]);
    const onSave = (0, react_1.useCallback)((args) => {
        setMissingFile(false);
        onChange(args.doc);
        closeDrawer();
    }, [onChange, closeDrawer]);
    const onSelect = (0, react_1.useCallback)((args) => {
        setMissingFile(false);
        onChange({
            id: args.docID,
        });
        closeListDrawer();
    }, [onChange, closeListDrawer]);
    return (react_1.default.createElement("div", { className: classes, style: {
            ...style,
            width,
        } },
        react_1.default.createElement(GetFilterOptions_1.GetFilterOptions, { ...{
                filterOptionsResult,
                setFilterOptionsResult,
                filterOptions,
                path,
                relationTo,
            } }),
        react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage }),
        react_1.default.createElement(Label_1.default, { htmlFor: `field-${path.replace(/\./gi, '__')}`, label: label, required: required }),
        (collection === null || collection === void 0 ? void 0 : collection.upload) && (react_1.default.createElement(react_1.default.Fragment, null,
            (file && !missingFile) && (react_1.default.createElement(FileDetails_1.default, { collection: collection, doc: file, handleRemove: () => {
                    onChange(null);
                } })),
            (!file || missingFile) && (react_1.default.createElement("div", { className: `${baseClass}__wrap` },
                react_1.default.createElement("div", { className: `${baseClass}__buttons` },
                    react_1.default.createElement(DocumentDrawerToggler, { className: `${baseClass}__toggler` },
                        react_1.default.createElement(Button_1.default, { buttonStyle: "secondary", el: "div" }, t('uploadNewLabel', { label: (0, getTranslation_1.getTranslation)(collection.labels.singular, i18n) }))),
                    react_1.default.createElement(ListDrawerToggler, { className: `${baseClass}__toggler` },
                        react_1.default.createElement(Button_1.default, { buttonStyle: "secondary", el: "div" }, t('chooseFromExisting')))))),
            react_1.default.createElement(FieldDescription_1.default, { value: file, description: description }))),
        react_1.default.createElement(DocumentDrawer, { onSave: onSave }),
        react_1.default.createElement(ListDrawer, { onSelect: onSelect })));
};
exports.default = UploadInput;
//# sourceMappingURL=Input.js.map