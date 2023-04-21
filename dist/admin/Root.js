'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - need to do this because this file doesn't actually exist
const payload_config_1 = __importDefault(require("payload-config"));
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const scroll_info_1 = require("@faceless-ui/scroll-info");
const window_info_1 = require("@faceless-ui/window-info");
const modal_1 = require("@faceless-ui/modal");
const react_toastify_1 = require("react-toastify");
const Auth_1 = require("./components/utilities/Auth");
const Config_1 = require("./components/utilities/Config");
const Preferences_1 = require("./components/utilities/Preferences");
const CustomProvider_1 = require("./components/utilities/CustomProvider");
const SearchParams_1 = require("./components/utilities/SearchParams");
const Locale_1 = require("./components/utilities/Locale");
const Routes_1 = __importDefault(require("./components/Routes"));
const StepNav_1 = require("./components/elements/StepNav");
const Theme_1 = require("./components/utilities/Theme");
const I18n_1 = require("./components/utilities/I18n");
const LoadingOverlay_1 = require("./components/utilities/LoadingOverlay");
require("./scss/app.scss");
const Root = () => (react_1.default.createElement(react_1.default.Fragment, null,
    react_1.default.createElement(Config_1.ConfigProvider, { config: payload_config_1.default },
        react_1.default.createElement(I18n_1.I18n, null),
        react_1.default.createElement(window_info_1.WindowInfoProvider, { breakpoints: {
                xs: '(max-width: 400px)',
                s: '(max-width: 768px)',
                m: '(max-width: 1024px)',
                l: '(max-width: 1440px)',
            } },
            react_1.default.createElement(scroll_info_1.ScrollInfoProvider, null,
                react_1.default.createElement(react_router_dom_1.BrowserRouter, null,
                    react_1.default.createElement(modal_1.ModalProvider, { classPrefix: "payload", zIndex: "var(--z-modal)", transTime: 0 },
                        react_1.default.createElement(Auth_1.AuthProvider, null,
                            react_1.default.createElement(Preferences_1.PreferencesProvider, null,
                                react_1.default.createElement(Theme_1.ThemeProvider, null,
                                    react_1.default.createElement(SearchParams_1.SearchParamsProvider, null,
                                        react_1.default.createElement(Locale_1.LocaleProvider, null,
                                            react_1.default.createElement(StepNav_1.StepNavProvider, null,
                                                react_1.default.createElement(LoadingOverlay_1.LoadingOverlayProvider, null,
                                                    react_1.default.createElement(CustomProvider_1.CustomProvider, null,
                                                        react_1.default.createElement(Routes_1.default, null))))))),
                                react_1.default.createElement(modal_1.ModalContainer, null)))))))),
    react_1.default.createElement(react_toastify_1.ToastContainer, { position: "bottom-center", transition: react_toastify_1.Slide, icon: false })));
exports.default = Root;
//# sourceMappingURL=Root.js.map