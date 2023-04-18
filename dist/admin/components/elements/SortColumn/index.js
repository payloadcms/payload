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
const react_router_dom_1 = require("react-router-dom");
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const Button_1 = __importDefault(require("../Button"));
const SearchParams_1 = require("../../utilities/SearchParams");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'sort-column';
const SortColumn = (props) => {
    const { label, name, disable = false, } = props;
    const params = (0, SearchParams_1.useSearchParams)();
    const history = (0, react_router_dom_1.useHistory)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const { sort } = params;
    const desc = `-${name}`;
    const asc = name;
    const ascClasses = [`${baseClass}__asc`];
    if (sort === asc)
        ascClasses.push(`${baseClass}--active`);
    const descClasses = [`${baseClass}__desc`];
    if (sort === desc)
        descClasses.push(`${baseClass}--active`);
    const setSort = (0, react_1.useCallback)((newSort) => {
        history.push({
            search: qs_1.default.stringify({
                ...params,
                sort: newSort,
            }, { addQueryPrefix: true }),
        });
    }, [params, history]);
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("span", { className: `${baseClass}__label` }, (0, getTranslation_1.getTranslation)(label, i18n)),
        !disable && (react_1.default.createElement("span", { className: `${baseClass}__buttons` },
            react_1.default.createElement(Button_1.default, { round: true, buttonStyle: "none", className: ascClasses.join(' '), onClick: () => setSort(asc) },
                react_1.default.createElement(Chevron_1.default, null)),
            react_1.default.createElement(Button_1.default, { round: true, buttonStyle: "none", className: descClasses.join(' '), onClick: () => setSort(desc) },
                react_1.default.createElement(Chevron_1.default, null))))));
};
exports.default = SortColumn;
//# sourceMappingURL=index.js.map