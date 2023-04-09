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
const Auth_1 = require("../../utilities/Auth");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const Menu_1 = __importDefault(require("../../icons/Menu"));
const CloseMenu_1 = __importDefault(require("../../icons/CloseMenu"));
const Icon_1 = __importDefault(require("../../graphics/Icon"));
const Account_1 = __importDefault(require("../../graphics/Account"));
const Localizer_1 = __importDefault(require("../Localizer"));
const NavGroup_1 = __importDefault(require("../NavGroup"));
const Logout_1 = __importDefault(require("../Logout"));
const groupNavItems_1 = require("../../../utilities/groupNavItems");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'nav';
const DefaultNav = () => {
    const { permissions } = (0, Auth_1.useAuth)();
    const [menuActive, setMenuActive] = (0, react_1.useState)(false);
    const [groups, setGroups] = (0, react_1.useState)([]);
    const history = (0, react_router_dom_1.useHistory)();
    const { i18n } = (0, react_i18next_1.useTranslation)('general');
    const { collections, globals, routes: { admin, }, admin: { components: { beforeNavLinks, afterNavLinks, }, }, } = (0, Config_1.useConfig)();
    const classes = [
        baseClass,
        menuActive && `${baseClass}--menu-active`,
    ].filter(Boolean)
        .join(' ');
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
    }, [collections, globals, permissions, i18n, i18n.language]);
    (0, react_1.useEffect)(() => history.listen(() => {
        setMenuActive(false);
    }), [history]);
    return (react_1.default.createElement("aside", { className: classes },
        react_1.default.createElement("div", { className: `${baseClass}__scroll` },
            react_1.default.createElement("header", null,
                react_1.default.createElement(react_router_dom_1.Link, { to: admin, className: `${baseClass}__brand` },
                    react_1.default.createElement(Icon_1.default, null)),
                react_1.default.createElement("button", { type: "button", className: `${baseClass}__mobile-menu-btn`, onClick: () => setMenuActive(!menuActive) },
                    menuActive && (react_1.default.createElement(CloseMenu_1.default, null)),
                    !menuActive && (react_1.default.createElement(Menu_1.default, null)))),
            react_1.default.createElement("nav", { className: `${baseClass}__wrap` },
                Array.isArray(beforeNavLinks) && beforeNavLinks.map((Component, i) => react_1.default.createElement(Component, { key: i })),
                groups.map(({ label, entities }, key) => {
                    return (react_1.default.createElement(NavGroup_1.default, { ...{ key, label } }, entities.map(({ entity, type }, i) => {
                        let entityLabel;
                        let href;
                        let id;
                        if (type === groupNavItems_1.EntityType.collection) {
                            href = `${admin}/collections/${entity.slug}`;
                            entityLabel = (0, getTranslation_1.getTranslation)(entity.labels.plural, i18n);
                            id = `nav-${entity.slug}`;
                        }
                        if (type === groupNavItems_1.EntityType.global) {
                            href = `${admin}/globals/${entity.slug}`;
                            entityLabel = (0, getTranslation_1.getTranslation)(entity.label, i18n);
                            id = `nav-global-${entity.slug}`;
                        }
                        return (react_1.default.createElement(react_router_dom_1.NavLink, { id: id, className: `${baseClass}__link`, activeClassName: "active", key: i, to: href },
                            react_1.default.createElement(Chevron_1.default, null),
                            entityLabel));
                    })));
                }),
                Array.isArray(afterNavLinks) && afterNavLinks.map((Component, i) => react_1.default.createElement(Component, { key: i })),
                react_1.default.createElement("div", { className: `${baseClass}__controls` },
                    react_1.default.createElement(Localizer_1.default, null),
                    react_1.default.createElement(react_router_dom_1.Link, { to: `${admin}/account`, className: `${baseClass}__account` },
                        react_1.default.createElement(Account_1.default, null)),
                    react_1.default.createElement(Logout_1.default, null))))));
};
const Nav = () => {
    const { admin: { components: { Nav: CustomNav, } = {
        Nav: undefined,
    }, } = {}, } = (0, Config_1.useConfig)();
    return (react_1.default.createElement(RenderCustomComponent_1.default, { CustomComponent: CustomNav, DefaultComponent: DefaultNav }));
};
exports.default = Nav;
//# sourceMappingURL=index.js.map