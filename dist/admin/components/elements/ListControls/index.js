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
const react_animate_height_1 = __importDefault(require("react-animate-height"));
const react_i18next_1 = require("react-i18next");
const window_info_1 = require("@faceless-ui/window-info");
const types_1 = require("../../../../fields/config/types");
const SearchFilter_1 = __importDefault(require("../SearchFilter"));
const ColumnSelector_1 = __importDefault(require("../ColumnSelector"));
const WhereBuilder_1 = __importDefault(require("../WhereBuilder"));
const SortComplex_1 = __importDefault(require("../SortComplex"));
const Button_1 = __importDefault(require("../Button"));
const SearchParams_1 = require("../../utilities/SearchParams");
const validateWhereQuery_1 = __importDefault(require("../WhereBuilder/validateWhereQuery"));
const flattenTopLevelFields_1 = __importDefault(require("../../../../utilities/flattenTopLevelFields"));
const getTextFieldsToBeSearched_1 = require("./getTextFieldsToBeSearched");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Pill_1 = __importDefault(require("../Pill"));
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const EditMany_1 = __importDefault(require("../EditMany"));
const DeleteMany_1 = __importDefault(require("../DeleteMany"));
const PublishMany_1 = __importDefault(require("../PublishMany"));
const UnpublishMany_1 = __importDefault(require("../UnpublishMany"));
require("./index.scss");
const baseClass = 'list-controls';
const ListControls = (props) => {
    var _a;
    const { collection, enableColumns = true, enableSort = false, handleSortChange, handleWhereChange, modifySearchQuery = true, resetParams, collection: { fields, admin: { useAsTitle, listSearchableFields, }, }, } = props;
    const params = (0, SearchParams_1.useSearchParams)();
    const shouldInitializeWhereOpened = (0, validateWhereQuery_1.default)(params === null || params === void 0 ? void 0 : params.where);
    const [titleField] = (0, react_1.useState)(() => {
        const topLevelFields = (0, flattenTopLevelFields_1.default)(fields);
        return topLevelFields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === useAsTitle);
    });
    const [textFieldsToBeSearched] = (0, react_1.useState)((0, getTextFieldsToBeSearched_1.getTextFieldsToBeSearched)(listSearchableFields, fields));
    const [visibleDrawer, setVisibleDrawer] = (0, react_1.useState)(shouldInitializeWhereOpened ? 'where' : undefined);
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const { breakpoints: { s: smallBreak } } = (0, window_info_1.useWindowInfo)();
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            react_1.default.createElement(SearchFilter_1.default, { fieldName: titleField && (0, types_1.fieldAffectsData)(titleField) ? titleField.name : undefined, handleChange: handleWhereChange, modifySearchQuery: modifySearchQuery, fieldLabel: (_a = (titleField && (0, types_1.fieldAffectsData)(titleField) && (0, getTranslation_1.getTranslation)(titleField.label || titleField.name, i18n))) !== null && _a !== void 0 ? _a : undefined, listSearchableFields: textFieldsToBeSearched }),
            react_1.default.createElement("div", { className: `${baseClass}__buttons` },
                react_1.default.createElement("div", { className: `${baseClass}__buttons-wrap` },
                    !smallBreak && (react_1.default.createElement(react_1.default.Fragment, null,
                        react_1.default.createElement(EditMany_1.default, { collection: collection, resetParams: resetParams }),
                        react_1.default.createElement(PublishMany_1.default, { collection: collection, resetParams: resetParams }),
                        react_1.default.createElement(UnpublishMany_1.default, { collection: collection, resetParams: resetParams }),
                        react_1.default.createElement(DeleteMany_1.default, { collection: collection, resetParams: resetParams }))),
                    enableColumns && (react_1.default.createElement(Pill_1.default, { pillStyle: "dark", className: `${baseClass}__toggle-columns ${visibleDrawer === 'columns' ? `${baseClass}__buttons-active` : ''}`, onClick: () => setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined), icon: react_1.default.createElement(Chevron_1.default, null) }, t('columns'))),
                    react_1.default.createElement(Pill_1.default, { pillStyle: "dark", className: `${baseClass}__toggle-where ${visibleDrawer === 'where' ? `${baseClass}__buttons-active` : ''}`, onClick: () => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined), icon: react_1.default.createElement(Chevron_1.default, null) }, t('filters')),
                    enableSort && (react_1.default.createElement(Button_1.default, { className: `${baseClass}__toggle-sort`, buttonStyle: visibleDrawer === 'sort' ? undefined : 'secondary', onClick: () => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined), icon: "chevron", iconStyle: "none" }, t('sort')))))),
        enableColumns && (react_1.default.createElement(react_animate_height_1.default, { className: `${baseClass}__columns`, height: visibleDrawer === 'columns' ? 'auto' : 0 },
            react_1.default.createElement(ColumnSelector_1.default, { collection: collection }))),
        react_1.default.createElement(react_animate_height_1.default, { className: `${baseClass}__where`, height: visibleDrawer === 'where' ? 'auto' : 0 },
            react_1.default.createElement(WhereBuilder_1.default, { collection: collection, modifySearchQuery: modifySearchQuery, handleChange: handleWhereChange })),
        enableSort && (react_1.default.createElement(react_animate_height_1.default, { className: `${baseClass}__sort`, height: visibleDrawer === 'sort' ? 'auto' : 0 },
            react_1.default.createElement(SortComplex_1.default, { modifySearchQuery: modifySearchQuery, collection: collection, handleChange: handleSortChange })))));
};
exports.default = ListControls;
//# sourceMappingURL=index.js.map