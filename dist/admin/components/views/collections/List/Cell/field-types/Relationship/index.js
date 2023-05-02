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
const Config_1 = require("../../../../../../utilities/Config");
const useIntersect_1 = __importDefault(require("../../../../../../../hooks/useIntersect"));
const RelationshipProvider_1 = require("../../../RelationshipProvider");
const getTranslation_1 = require("../../../../../../../../utilities/getTranslation");
const useTitle_1 = require("../../../../../../../hooks/useTitle");
require("./index.scss");
const baseClass = 'relationship-cell';
const totalToShow = 3;
const RelationshipCell = (props) => {
    var _a;
    const { field, data: cellData } = props;
    const config = (0, Config_1.useConfig)();
    const { collections, routes } = config;
    const [intersectionRef, entry] = (0, useIntersect_1.default)();
    const [values, setValues] = (0, react_1.useState)([]);
    const { getRelationships, documents } = (0, RelationshipProvider_1.useListRelationships)();
    const [hasRequested, setHasRequested] = (0, react_1.useState)(false);
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const isAboveViewport = ((_a = entry === null || entry === void 0 ? void 0 : entry.boundingClientRect) === null || _a === void 0 ? void 0 : _a.top) < window.innerHeight;
    (0, react_1.useEffect)(() => {
        if (cellData && isAboveViewport && !hasRequested) {
            const formattedValues = [];
            const arrayCellData = Array.isArray(cellData) ? cellData : [cellData];
            arrayCellData.slice(0, (arrayCellData.length < totalToShow ? arrayCellData.length : totalToShow)).forEach((cell) => {
                if (typeof cell === 'object' && 'relationTo' in cell && 'value' in cell) {
                    formattedValues.push(cell);
                }
                if ((typeof cell === 'number' || typeof cell === 'string') && 'relationTo' in field && typeof field.relationTo === 'string') {
                    formattedValues.push({
                        value: cell,
                        relationTo: field.relationTo,
                    });
                }
            });
            getRelationships(formattedValues);
            setHasRequested(true);
            setValues(formattedValues);
        }
    }, [cellData, field, collections, isAboveViewport, routes.api, hasRequested, getRelationships]);
    return (react_1.default.createElement("div", { className: baseClass, ref: intersectionRef },
        values.map(({ relationTo, value }, i) => {
            const document = documents[relationTo][value];
            const relatedCollection = collections.find(({ slug }) => slug === relationTo);
            const label = (0, useTitle_1.formatUseAsTitle)({
                doc: document === false ? null : document,
                collection: relatedCollection,
                i18n,
                config,
            });
            return (react_1.default.createElement(react_1.default.Fragment, { key: i },
                document === false && `${t('untitled')} - ID: ${value}`,
                document === null && `${t('loading')}...`,
                document && (label || `${t('untitled')} - ID: ${value}`),
                values.length > i + 1 && ', '));
        }),
        Array.isArray(cellData) && cellData.length > totalToShow
            && t('fields:itemsAndMore', { items: '', count: cellData.length - totalToShow }),
        values.length === 0 && t('noLabel', { label: (0, getTranslation_1.getTranslation)((field === null || field === void 0 ? void 0 : field.label) || '', i18n) })));
};
exports.default = RelationshipCell;
//# sourceMappingURL=index.js.map