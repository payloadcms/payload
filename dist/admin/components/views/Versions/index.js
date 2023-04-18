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
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const usePayloadAPI_1 = __importDefault(require("../../../hooks/usePayloadAPI"));
const Eyebrow_1 = __importDefault(require("../../elements/Eyebrow"));
const Loading_1 = require("../../elements/Loading");
const StepNav_1 = require("../../elements/StepNav");
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const IDLabel_1 = __importDefault(require("../../elements/IDLabel"));
const Table_1 = require("../../elements/Table");
const Paginator_1 = __importDefault(require("../../elements/Paginator"));
const PerPage_1 = __importDefault(require("../../elements/PerPage"));
const SearchParams_1 = require("../../utilities/SearchParams");
const Gutter_1 = require("../../elements/Gutter");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const columns_1 = require("./columns");
require("./index.scss");
const baseClass = 'versions';
const Versions = ({ collection, global }) => {
    var _a, _b, _c;
    const { serverURL, routes: { admin, api } } = (0, Config_1.useConfig)();
    const { setStepNav } = (0, StepNav_1.useStepNav)();
    const { params: { id } } = (0, react_router_dom_1.useRouteMatch)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('version');
    const [fetchURL, setFetchURL] = (0, react_1.useState)('');
    const { page, sort, limit } = (0, SearchParams_1.useSearchParams)();
    let docURL;
    let entityLabel;
    let slug;
    let editURL;
    if (collection) {
        ({ slug } = collection);
        docURL = `${serverURL}${api}/${slug}/${id}`;
        entityLabel = (0, getTranslation_1.getTranslation)(collection.labels.singular, i18n);
        editURL = `${admin}/collections/${collection.slug}/${id}`;
    }
    if (global) {
        ({ slug } = global);
        docURL = `${serverURL}${api}/globals/${slug}`;
        entityLabel = (0, getTranslation_1.getTranslation)(global.label, i18n);
        editURL = `${admin}/globals/${global.slug}`;
    }
    const useAsTitle = ((_a = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle) || 'id';
    const [{ data: doc }] = (0, usePayloadAPI_1.default)(docURL, { initialParams: { draft: 'true' } });
    const [{ data: versionsData, isLoading: isLoadingVersions }, { setParams }] = (0, usePayloadAPI_1.default)(fetchURL);
    (0, react_1.useEffect)(() => {
        let nav = [];
        if (collection) {
            let docLabel = '';
            if (doc) {
                if (useAsTitle) {
                    if (doc[useAsTitle]) {
                        docLabel = doc[useAsTitle];
                    }
                    else {
                        docLabel = `[${t('general:untitled')}]`;
                    }
                }
                else {
                    docLabel = doc.id;
                }
            }
            nav = [
                {
                    url: `${admin}/collections/${collection.slug}`,
                    label: (0, getTranslation_1.getTranslation)(collection.labels.plural, i18n),
                },
                {
                    label: docLabel,
                    url: editURL,
                },
                {
                    label: t('versions'),
                },
            ];
        }
        if (global) {
            nav = [
                {
                    url: editURL,
                    label: (0, getTranslation_1.getTranslation)(global.label, i18n),
                },
                {
                    label: t('versions'),
                },
            ];
        }
        setStepNav(nav);
    }, [setStepNav, collection, global, useAsTitle, doc, admin, id, editURL, t, i18n]);
    (0, react_1.useEffect)(() => {
        const params = {
            depth: 1,
            page: undefined,
            sort: undefined,
            limit,
            where: {},
        };
        if (page)
            params.page = page;
        if (sort)
            params.sort = sort;
        let fetchURLToSet;
        if (collection) {
            fetchURLToSet = `${serverURL}${api}/${collection.slug}/versions`;
            params.where = {
                parent: {
                    equals: id,
                },
            };
        }
        if (global) {
            fetchURLToSet = `${serverURL}${api}/globals/${global.slug}/versions`;
        }
        // Performance enhancement
        // Setting the Fetch URL this way
        // prevents a double-fetch
        setFetchURL(fetchURLToSet);
        setParams(params);
    }, [setParams, page, sort, limit, serverURL, api, id, global, collection]);
    let useIDLabel = doc[useAsTitle] === (doc === null || doc === void 0 ? void 0 : doc.id);
    let heading;
    let metaDesc;
    let metaTitle;
    if (collection) {
        metaTitle = `${t('versions')} - ${doc[useAsTitle]} - ${entityLabel}`;
        metaDesc = t('viewingVersions', { documentTitle: doc[useAsTitle], entityLabel });
        heading = (doc === null || doc === void 0 ? void 0 : doc[useAsTitle]) || `[${t('general:untitled')}]`;
    }
    if (global) {
        metaTitle = `${t('versions')} - ${entityLabel}`;
        metaDesc = t('viewingVersionsGlobal', { entityLabel });
        heading = entityLabel;
        useIDLabel = false;
    }
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Loading_1.LoadingOverlayToggle, { show: isLoadingVersions, name: "versions" }),
        react_1.default.createElement("div", { className: baseClass },
            react_1.default.createElement(Meta_1.default, { title: metaTitle, description: metaDesc }),
            react_1.default.createElement(Eyebrow_1.default, null),
            react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__wrap` },
                react_1.default.createElement("header", { className: `${baseClass}__header` },
                    react_1.default.createElement("div", { className: `${baseClass}__intro` }, t('showingVersionsFor')),
                    useIDLabel && (react_1.default.createElement(IDLabel_1.default, { id: doc === null || doc === void 0 ? void 0 : doc.id })),
                    !useIDLabel && (react_1.default.createElement("h1", null, heading))),
                (versionsData === null || versionsData === void 0 ? void 0 : versionsData.totalDocs) > 0 && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement(Table_1.Table, { data: versionsData === null || versionsData === void 0 ? void 0 : versionsData.docs, columns: (0, columns_1.buildVersionColumns)(collection, global, t) }),
                    react_1.default.createElement("div", { className: `${baseClass}__page-controls` },
                        react_1.default.createElement(Paginator_1.default, { limit: versionsData.limit, totalPages: versionsData.totalPages, page: versionsData.page, hasPrevPage: versionsData.hasPrevPage, hasNextPage: versionsData.hasNextPage, prevPage: versionsData.prevPage, nextPage: versionsData.nextPage, numberOfNeighbors: 1 }),
                        (versionsData === null || versionsData === void 0 ? void 0 : versionsData.totalDocs) > 0 && (react_1.default.createElement(react_1.default.Fragment, null,
                            react_1.default.createElement("div", { className: `${baseClass}__page-info` },
                                (versionsData.page * versionsData.limit) - (versionsData.limit - 1),
                                "-",
                                versionsData.totalPages > 1 && versionsData.totalPages !== versionsData.page ? (versionsData.limit * versionsData.page) : versionsData.totalDocs,
                                ' ',
                                t('of'),
                                ' ',
                                versionsData.totalDocs),
                            react_1.default.createElement(PerPage_1.default, { limits: (_c = (_b = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _b === void 0 ? void 0 : _b.pagination) === null || _c === void 0 ? void 0 : _c.limits, limit: limit ? Number(limit) : 10 })))))),
                (versionsData === null || versionsData === void 0 ? void 0 : versionsData.totalDocs) === 0 && (react_1.default.createElement("div", { className: `${baseClass}__no-versions` }, t('noFurtherVersionsFound')))))));
};
exports.default = Versions;
//# sourceMappingURL=index.js.map