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
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../utilities/Config");
const ReactSelect_1 = __importDefault(require("../../../elements/ReactSelect"));
const shared_1 = require("../shared");
const formatDate_1 = require("../../../../utilities/formatDate");
require("./index.scss");
const baseClass = 'compare-version';
const maxResultsPerRequest = 10;
const baseOptions = [
    shared_1.mostRecentVersionOption,
];
const CompareVersion = (props) => {
    const { onChange, value, baseURL, versionID, parentID, publishedDoc } = props;
    const { admin: { dateFormat, }, } = (0, Config_1.useConfig)();
    const [options, setOptions] = (0, react_1.useState)(baseOptions);
    const [lastLoadedPage, setLastLoadedPage] = (0, react_1.useState)(1);
    const [errorLoading, setErrorLoading] = (0, react_1.useState)('');
    const { t, i18n } = (0, react_i18next_1.useTranslation)('version');
    const getResults = (0, react_1.useCallback)(async ({ lastLoadedPage: lastLoadedPageArg, }) => {
        const query = {
            limit: maxResultsPerRequest,
            page: lastLoadedPageArg,
            depth: 0,
            where: {
                and: [
                    {
                        id: {
                            not_equals: versionID,
                        },
                    },
                ],
            },
        };
        if (parentID) {
            query.where.and.push({
                parent: {
                    equals: parentID,
                },
            });
        }
        const search = qs_1.default.stringify(query);
        const response = await fetch(`${baseURL}?${search}`, {
            credentials: 'include',
            headers: {
                'Accept-Language': i18n.language,
            },
        });
        if (response.ok) {
            const data = await response.json();
            if (data.docs.length > 0) {
                setOptions((existingOptions) => [
                    ...existingOptions,
                    ...data.docs.map((doc) => ({
                        label: (0, formatDate_1.formatDate)(doc.createdAt, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language),
                        value: doc.id,
                    })),
                ]);
                setLastLoadedPage(data.page);
            }
        }
        else {
            setErrorLoading(t('error:unspecific'));
        }
    }, [dateFormat, baseURL, parentID, versionID, t, i18n]);
    const classes = [
        'field-type',
        baseClass,
        errorLoading && 'error-loading',
    ].filter(Boolean).join(' ');
    (0, react_1.useEffect)(() => {
        getResults({ lastLoadedPage: 1 });
    }, [getResults]);
    (0, react_1.useEffect)(() => {
        if ((publishedDoc === null || publishedDoc === void 0 ? void 0 : publishedDoc._status) === 'published')
            setOptions((currentOptions) => [shared_1.publishedVersionOption, ...currentOptions]);
    }, [publishedDoc]);
    return (react_1.default.createElement("div", { className: classes },
        react_1.default.createElement("div", { className: `${baseClass}__label` }, t('compareVersion')),
        !errorLoading && (react_1.default.createElement(ReactSelect_1.default, { isSearchable: false, placeholder: t('selectVersionToCompare'), onChange: onChange, onMenuScrollToBottom: () => {
                getResults({ lastLoadedPage: lastLoadedPage + 1 });
            }, value: value, options: options })),
        errorLoading && (react_1.default.createElement("div", { className: `${baseClass}__error-loading` }, errorLoading))));
};
exports.default = CompareVersion;
//# sourceMappingURL=index.js.map