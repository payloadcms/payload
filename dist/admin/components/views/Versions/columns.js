"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVersionColumns = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const SortColumn_1 = __importDefault(require("../../elements/SortColumn"));
const __1 = require("../..");
const formatDate_1 = require("../../../utilities/formatDate");
const CreatedAtCell = ({ collection, global, id, date }) => {
    const { routes: { admin }, admin: { dateFormat } } = (0, Config_1.useConfig)();
    const { params: { id: docID } } = (0, react_router_dom_1.useRouteMatch)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    let to;
    if (collection)
        to = `${admin}/collections/${collection.slug}/${docID}/versions/${id}`;
    if (global)
        to = `${admin}/globals/${global.slug}/versions/${id}`;
    return (react_1.default.createElement(react_router_dom_1.Link, { to: to }, date && (0, formatDate_1.formatDate)(date, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language)));
};
const TextCell = ({ children }) => (react_1.default.createElement("span", null, children));
const buildVersionColumns = (collection, global, t) => [
    {
        accessor: 'updatedAt',
        active: true,
        label: '',
        name: '',
        components: {
            Heading: (react_1.default.createElement(SortColumn_1.default, { label: t('general:updatedAt'), name: "updatedAt" })),
            renderCell: (row, data) => (react_1.default.createElement(CreatedAtCell, { collection: collection, global: global, id: row === null || row === void 0 ? void 0 : row.id, date: data })),
        },
    },
    {
        accessor: 'id',
        active: true,
        label: '',
        name: '',
        components: {
            Heading: (react_1.default.createElement(SortColumn_1.default, { label: t('versionID'), disable: true, name: "id" })),
            renderCell: (row, data) => react_1.default.createElement(TextCell, null, data),
        },
    },
    {
        accessor: 'autosave',
        active: true,
        label: '',
        name: '',
        components: {
            Heading: (react_1.default.createElement(SortColumn_1.default, { label: t('type'), name: "autosave", disable: true })),
            renderCell: (row) => (react_1.default.createElement(TextCell, null,
                (row === null || row === void 0 ? void 0 : row.autosave) && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement(__1.Pill, null, t('autosave')),
                    "\u00A0\u00A0")),
                (row === null || row === void 0 ? void 0 : row.version._status) === 'published' && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement(__1.Pill, { pillStyle: "success" }, t('published')),
                    "\u00A0\u00A0")),
                (row === null || row === void 0 ? void 0 : row.version._status) === 'draft' && (react_1.default.createElement(__1.Pill, null, t('draft'))))),
        },
    },
];
exports.buildVersionColumns = buildVersionColumns;
//# sourceMappingURL=columns.js.map