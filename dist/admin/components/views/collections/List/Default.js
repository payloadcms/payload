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
const window_info_1 = require("@faceless-ui/window-info");
const Eyebrow_1 = __importDefault(require("../../../elements/Eyebrow"));
const Paginator_1 = __importDefault(require("../../../elements/Paginator"));
const ListControls_1 = __importDefault(require("../../../elements/ListControls"));
const ListSelection_1 = __importDefault(require("../../../elements/ListSelection"));
const Pill_1 = __importDefault(require("../../../elements/Pill"));
const Button_1 = __importDefault(require("../../../elements/Button"));
const Table_1 = require("../../../elements/Table");
const Meta_1 = __importDefault(require("../../../utilities/Meta"));
const ViewDescription_1 = __importDefault(require("../../../elements/ViewDescription"));
const PerPage_1 = __importDefault(require("../../../elements/PerPage"));
const Gutter_1 = require("../../../elements/Gutter");
const RelationshipProvider_1 = require("./RelationshipProvider");
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const ShimmerEffect_1 = require("../../../elements/ShimmerEffect");
const SelectionProvider_1 = require("./SelectionProvider");
const EditMany_1 = __importDefault(require("../../../elements/EditMany"));
const DeleteMany_1 = __importDefault(require("../../../elements/DeleteMany"));
const PublishMany_1 = __importDefault(require("../../../elements/PublishMany"));
const UnpublishMany_1 = __importDefault(require("../../../elements/UnpublishMany"));
require("./index.scss");
const baseClass = 'collection-list';
const DefaultList = (props) => {
    var _a, _b;
    const { collection, collection: { labels: { singular: singularLabel, plural: pluralLabel, }, admin: { description, } = {}, }, data, newDocumentURL, limit, hasCreatePermission, disableEyebrow, modifySearchParams, handleSortChange, handleWhereChange, handlePageChange, handlePerPageChange, customHeader, resetParams, } = props;
    const { breakpoints: { s: smallBreak } } = (0, window_info_1.useWindowInfo)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Meta_1.default, { title: (0, getTranslation_1.getTranslation)(collection.labels.plural, i18n) }),
        react_1.default.createElement(SelectionProvider_1.SelectionProvider, { docs: data.docs, totalDocs: data.totalDocs },
            !disableEyebrow && (react_1.default.createElement(Eyebrow_1.default, null)),
            react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__wrap` },
                react_1.default.createElement("header", { className: `${baseClass}__header` },
                    customHeader && customHeader,
                    !customHeader && (react_1.default.createElement(react_1.Fragment, null,
                        react_1.default.createElement("h1", null, (0, getTranslation_1.getTranslation)(pluralLabel, i18n)),
                        hasCreatePermission && (react_1.default.createElement(Pill_1.default, { to: newDocumentURL }, t('createNew'))),
                        !smallBreak && (react_1.default.createElement(ListSelection_1.default, { label: (0, getTranslation_1.getTranslation)(collection.labels.plural, i18n) })),
                        description && (react_1.default.createElement("div", { className: `${baseClass}__sub-header` },
                            react_1.default.createElement(ViewDescription_1.default, { description: description })))))),
                react_1.default.createElement(ListControls_1.default, { collection: collection, modifySearchQuery: modifySearchParams, handleSortChange: handleSortChange, handleWhereChange: handleWhereChange, resetParams: resetParams }),
                !data.docs && (react_1.default.createElement(ShimmerEffect_1.StaggeredShimmers, { className: [`${baseClass}__shimmer`, `${baseClass}__shimmer--rows`].join(' '), count: 6 })),
                (data.docs && data.docs.length > 0) && (react_1.default.createElement(RelationshipProvider_1.RelationshipProvider, null,
                    react_1.default.createElement(Table_1.Table, { data: data.docs }))),
                data.docs && data.docs.length === 0 && (react_1.default.createElement("div", { className: `${baseClass}__no-results` },
                    react_1.default.createElement("p", null, t('noResults', { label: (0, getTranslation_1.getTranslation)(pluralLabel, i18n) })),
                    hasCreatePermission && newDocumentURL && (react_1.default.createElement(Button_1.default, { el: "link", to: newDocumentURL }, t('createNewLabel', { label: (0, getTranslation_1.getTranslation)(singularLabel, i18n) }))))),
                react_1.default.createElement("div", { className: `${baseClass}__page-controls` },
                    react_1.default.createElement(Paginator_1.default, { limit: data.limit, totalPages: data.totalPages, page: data.page, hasPrevPage: data.hasPrevPage, hasNextPage: data.hasNextPage, prevPage: data.prevPage, nextPage: data.nextPage, numberOfNeighbors: 1, disableHistoryChange: modifySearchParams === false, onChange: handlePageChange }),
                    (data === null || data === void 0 ? void 0 : data.totalDocs) > 0 && (react_1.default.createElement(react_1.Fragment, null,
                        react_1.default.createElement("div", { className: `${baseClass}__page-info` },
                            (data.page * data.limit) - (data.limit - 1),
                            "-",
                            data.totalPages > 1 && data.totalPages !== data.page ? (data.limit * data.page) : data.totalDocs,
                            ' ',
                            t('of'),
                            ' ',
                            data.totalDocs),
                        react_1.default.createElement(PerPage_1.default, { limits: (_b = (_a = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _a === void 0 ? void 0 : _a.pagination) === null || _b === void 0 ? void 0 : _b.limits, limit: limit, modifySearchParams: modifySearchParams, handleChange: handlePerPageChange, resetPage: data.totalDocs <= data.pagingCounter }),
                        react_1.default.createElement("div", { className: `${baseClass}__list-selection` }, smallBreak && (react_1.default.createElement(react_1.Fragment, null,
                            react_1.default.createElement(ListSelection_1.default, { label: (0, getTranslation_1.getTranslation)(collection.labels.plural, i18n) }),
                            react_1.default.createElement("div", { className: `${baseClass}__list-selection-actions` },
                                react_1.default.createElement(EditMany_1.default, { collection: collection, resetParams: resetParams }),
                                react_1.default.createElement(PublishMany_1.default, { collection: collection, resetParams: resetParams }),
                                react_1.default.createElement(UnpublishMany_1.default, { collection: collection, resetParams: resetParams }),
                                react_1.default.createElement(DeleteMany_1.default, { collection: collection, resetParams: resetParams }))))))))))));
};
exports.default = DefaultList;
//# sourceMappingURL=Default.js.map