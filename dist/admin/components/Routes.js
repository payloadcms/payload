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
const Auth_1 = require("./utilities/Auth");
const Config_1 = require("./utilities/Config");
const List_1 = __importDefault(require("./views/collections/List"));
const Default_1 = __importDefault(require("./templates/Default"));
const api_1 = require("../api");
const StayLoggedIn_1 = __importDefault(require("./modals/StayLoggedIn"));
const Versions_1 = __importDefault(require("./views/Versions"));
const Version_1 = __importDefault(require("./views/Version"));
const DocumentInfo_1 = require("./utilities/DocumentInfo");
const Locale_1 = require("./utilities/Locale");
const Loading_1 = require("./elements/Loading");
const Dashboard = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/Dashboard'))));
const ForgotPassword = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/ForgotPassword'))));
const Login = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/Login'))));
const Logout = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/Logout'))));
const NotFound = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/NotFound'))));
const Verify = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/Verify'))));
const CreateFirstUser = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/CreateFirstUser'))));
const Edit = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/collections/Edit'))));
const EditGlobal = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/Global'))));
const ResetPassword = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/ResetPassword'))));
const Unauthorized = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/Unauthorized'))));
const Account = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./views/Account'))));
const Routes = () => {
    const [initialized, setInitialized] = (0, react_1.useState)(null);
    const { user, permissions, refreshCookie } = (0, Auth_1.useAuth)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const locale = (0, Locale_1.useLocale)();
    const canAccessAdmin = permissions === null || permissions === void 0 ? void 0 : permissions.canAccessAdmin;
    const config = (0, Config_1.useConfig)();
    const { admin: { user: userSlug, logoutRoute, inactivityRoute: logoutInactivityRoute, components: { routes: customRoutes, } = {}, }, routes, collections, globals, } = config;
    const isLoadingUser = Boolean(typeof user === 'undefined' || (user && typeof canAccessAdmin === 'undefined'));
    const userCollection = collections.find(({ slug }) => slug === userSlug);
    (0, react_1.useEffect)(() => {
        const { slug } = userCollection;
        if (!userCollection.auth.disableLocalStrategy) {
            api_1.requests.get(`${routes.api}/${slug}/init`, {
                headers: {
                    'Accept-Language': i18n.language,
                },
            }).then((res) => res.json().then((data) => {
                if (data && 'initialized' in data) {
                    setInitialized(data.initialized);
                }
            }));
        }
        else {
            setInitialized(true);
        }
    }, [i18n.language, routes, userCollection]);
    return (react_1.default.createElement(react_1.Suspense, { fallback: (react_1.default.createElement(Loading_1.LoadingOverlayToggle, { show: true, name: "route-suspense" })) },
        react_1.default.createElement(Loading_1.LoadingOverlayToggle, { name: "route-loader", show: isLoadingUser }),
        react_1.default.createElement(react_router_dom_1.Route, { path: routes.admin, render: ({ match }) => {
                if (initialized === false) {
                    return (react_1.default.createElement(react_router_dom_1.Switch, null,
                        react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}/create-first-user` },
                            react_1.default.createElement(CreateFirstUser, { setInitialized: setInitialized })),
                        react_1.default.createElement(react_router_dom_1.Route, null,
                            react_1.default.createElement(react_router_dom_1.Redirect, { to: `${match.url}/create-first-user` }))));
                }
                if (initialized === true && !isLoadingUser) {
                    return (react_1.default.createElement(react_router_dom_1.Switch, null,
                        Array.isArray(customRoutes) && customRoutes.map(({ path, Component, strict, exact, sensitive }) => (react_1.default.createElement(react_router_dom_1.Route, { key: `${match.url}${path}`, path: `${match.url}${path}`, strict: strict, exact: exact, sensitive: sensitive },
                            react_1.default.createElement(Component, { user: user, canAccessAdmin: canAccessAdmin })))),
                        react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}/login` },
                            react_1.default.createElement(Login, null)),
                        react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}${logoutRoute}` },
                            react_1.default.createElement(Logout, null)),
                        react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}${logoutInactivityRoute}` },
                            react_1.default.createElement(Logout, { inactivity: true })),
                        !userCollection.auth.disableLocalStrategy && (react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}/forgot` },
                            react_1.default.createElement(ForgotPassword, null))),
                        !userCollection.auth.disableLocalStrategy && (react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}/reset/:token` },
                            react_1.default.createElement(ResetPassword, null))),
                        collections.map((collection) => {
                            var _a;
                            if (((_a = collection === null || collection === void 0 ? void 0 : collection.auth) === null || _a === void 0 ? void 0 : _a.verify) && !collection.auth.disableLocalStrategy) {
                                return (react_1.default.createElement(react_router_dom_1.Route, { key: `${collection.slug}-verify`, path: `${match.url}/${collection.slug}/verify/:token`, exact: true },
                                    react_1.default.createElement(Verify, { collection: collection })));
                            }
                            return null;
                        }),
                        react_1.default.createElement(react_router_dom_1.Route, { render: () => {
                                if (user) {
                                    if (canAccessAdmin) {
                                        return (react_1.default.createElement(Default_1.default, null,
                                            react_1.default.createElement(react_router_dom_1.Switch, null,
                                                react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}/`, exact: true },
                                                    react_1.default.createElement(Dashboard, null)),
                                                react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}/account` },
                                                    react_1.default.createElement(DocumentInfo_1.DocumentInfoProvider, { collection: collections.find(({ slug }) => slug === userSlug), id: user.id },
                                                        react_1.default.createElement(Account, null))),
                                                collections.reduce((collectionRoutes, collection) => {
                                                    const routesToReturn = [
                                                        ...collectionRoutes,
                                                        react_1.default.createElement(react_router_dom_1.Route, { key: `${collection.slug}-list`, path: `${match.url}/collections/${collection.slug}`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[collection.slug]) === null || _b === void 0 ? void 0 : _b.read) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(List_1.default, { ...routeProps, collection: collection }));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }),
                                                        react_1.default.createElement(react_router_dom_1.Route, { key: `${collection.slug}-create`, path: `${match.url}/collections/${collection.slug}/create`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[collection.slug]) === null || _b === void 0 ? void 0 : _b.create) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(DocumentInfo_1.DocumentInfoProvider, { collection: collection },
                                                                        react_1.default.createElement(Edit, { ...routeProps, collection: collection })));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }),
                                                        react_1.default.createElement(react_router_dom_1.Route, { key: `${collection.slug}-edit`, path: `${match.url}/collections/${collection.slug}/:id`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                const { match: { params: { id } } } = routeProps;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[collection.slug]) === null || _b === void 0 ? void 0 : _b.read) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(DocumentInfo_1.DocumentInfoProvider, { key: `${collection.slug}-edit-${id}-${locale}`, collection: collection, id: id },
                                                                        react_1.default.createElement(Edit, { isEditing: true, ...routeProps, collection: collection })));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }),
                                                    ];
                                                    if (collection.versions) {
                                                        routesToReturn.push(react_1.default.createElement(react_router_dom_1.Route, { key: `${collection.slug}-versions`, path: `${match.url}/collections/${collection.slug}/:id/versions`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[collection.slug]) === null || _b === void 0 ? void 0 : _b.readVersions) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(Versions_1.default, { ...routeProps, collection: collection }));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }));
                                                        routesToReturn.push(react_1.default.createElement(react_router_dom_1.Route, { key: `${collection.slug}-view-version`, path: `${match.url}/collections/${collection.slug}/:id/versions/:versionID`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[collection.slug]) === null || _b === void 0 ? void 0 : _b.readVersions) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(Version_1.default, { ...routeProps, collection: collection }));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }));
                                                    }
                                                    return routesToReturn;
                                                }, []),
                                                globals && globals.reduce((globalRoutes, global) => {
                                                    const routesToReturn = [
                                                        ...globalRoutes,
                                                        react_1.default.createElement(react_router_dom_1.Route, { key: `${global.slug}`, path: `${match.url}/globals/${global.slug}`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.globals) === null || _a === void 0 ? void 0 : _a[global.slug]) === null || _b === void 0 ? void 0 : _b.read) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(DocumentInfo_1.DocumentInfoProvider, { global: global, key: `${global.slug}-${locale}` },
                                                                        react_1.default.createElement(EditGlobal, { ...routeProps, global: global })));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }),
                                                    ];
                                                    if (global.versions) {
                                                        routesToReturn.push(react_1.default.createElement(react_router_dom_1.Route, { key: `${global.slug}-versions`, path: `${match.url}/globals/${global.slug}/versions`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.globals) === null || _a === void 0 ? void 0 : _a[global.slug]) === null || _b === void 0 ? void 0 : _b.readVersions) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(Versions_1.default, { ...routeProps, global: global }));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }));
                                                        routesToReturn.push(react_1.default.createElement(react_router_dom_1.Route, { key: `${global.slug}-view-version`, path: `${match.url}/globals/${global.slug}/versions/:versionID`, exact: true, render: (routeProps) => {
                                                                var _a, _b, _c;
                                                                if ((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.globals) === null || _a === void 0 ? void 0 : _a[global.slug]) === null || _b === void 0 ? void 0 : _b.readVersions) === null || _c === void 0 ? void 0 : _c.permission) {
                                                                    return (react_1.default.createElement(Version_1.default, { ...routeProps, global: global }));
                                                                }
                                                                return react_1.default.createElement(Unauthorized, null);
                                                            } }));
                                                    }
                                                    return routesToReturn;
                                                }, []),
                                                react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}*` },
                                                    react_1.default.createElement(NotFound, null)))));
                                    }
                                    if (canAccessAdmin === false) {
                                        return react_1.default.createElement(Unauthorized, null);
                                    }
                                    return (
                                    // user without admin panel access
                                    react_1.default.createElement("div", null));
                                }
                                return react_1.default.createElement(react_router_dom_1.Redirect, { to: `${match.url}/login` });
                            } }),
                        react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}*` },
                            react_1.default.createElement(NotFound, null))));
                }
                return null;
            } }),
        react_1.default.createElement(StayLoggedIn_1.default, { refreshCookie: refreshCookie })));
};
exports.default = (0, react_router_dom_1.withRouter)(Routes);
//# sourceMappingURL=Routes.js.map