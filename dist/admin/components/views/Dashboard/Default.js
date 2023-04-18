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
const Eyebrow_1 = __importDefault(require("../../elements/Eyebrow"));
const Card_1 = __importDefault(require("../../elements/Card"));
const Button_1 = __importDefault(require("../../elements/Button"));
const Gutter_1 = require("../../elements/Gutter");
const groupNavItems_1 = require("../../../utilities/groupNavItems");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'dashboard';
const Dashboard = (props) => {
    const { collections, globals, permissions, } = props;
    const { push } = (0, react_router_dom_1.useHistory)();
    const { i18n } = (0, react_i18next_1.useTranslation)('general');
    const { routes: { admin, }, admin: { components: { afterDashboard, beforeDashboard, }, }, } = (0, Config_1.useConfig)();
    const [groups, setGroups] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        setGroups((0, groupNavItems_1.groupNavItems)([
            ...collections.map((collection) => {
                const entityToGroup = {
                    type: groupNavItems_1.EntityType.collection,
                    entity: collection,
                };
                return entityToGroup;
            }),
            ...globals.map((global) => {
                const entityToGroup = {
                    type: groupNavItems_1.EntityType.global,
                    entity: global,
                };
                return entityToGroup;
            }),
        ], permissions, i18n));
    }, [collections, globals, i18n, permissions]);
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Eyebrow_1.default, null),
        react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__wrap` },
            Array.isArray(beforeDashboard) && beforeDashboard.map((Component, i) => react_1.default.createElement(Component, { key: i })),
            groups.map(({ label, entities }, groupIndex) => {
                return (react_1.default.createElement(react_1.default.Fragment, { key: groupIndex },
                    react_1.default.createElement("h2", { className: `${baseClass}__label` }, label),
                    react_1.default.createElement("ul", { className: `${baseClass}__card-list` }, entities.map(({ entity, type }, entityIndex) => {
                        var _a, _b, _c;
                        let title;
                        let createHREF;
                        let onClick;
                        let hasCreatePermission;
                        if (type === groupNavItems_1.EntityType.collection) {
                            title = (0, getTranslation_1.getTranslation)(entity.labels.plural, i18n);
                            onClick = () => push({ pathname: `${admin}/collections/${entity.slug}` });
                            createHREF = `${admin}/collections/${entity.slug}/create`;
                            hasCreatePermission = (_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[entity.slug]) === null || _b === void 0 ? void 0 : _b.create) === null || _c === void 0 ? void 0 : _c.permission;
                        }
                        if (type === groupNavItems_1.EntityType.global) {
                            title = (0, getTranslation_1.getTranslation)(entity.label, i18n);
                            onClick = () => push({ pathname: `${admin}/globals/${entity.slug}` });
                        }
                        return (react_1.default.createElement("li", { key: entityIndex },
                            react_1.default.createElement(Card_1.default, { title: title, id: `card-${entity.slug}`, onClick: onClick, actions: (hasCreatePermission && type === groupNavItems_1.EntityType.collection) ? (react_1.default.createElement(Button_1.default, { el: "link", to: createHREF, icon: "plus", round: true, buttonStyle: "icon-label", iconStyle: "with-border" })) : undefined })));
                    }))));
            }),
            Array.isArray(afterDashboard) && afterDashboard.map((Component, i) => react_1.default.createElement(Component, { key: i })))));
};
exports.default = Dashboard;
//# sourceMappingURL=Default.js.map