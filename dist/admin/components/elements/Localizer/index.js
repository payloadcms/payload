"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Locale_1 = require("../../utilities/Locale");
const SearchParams_1 = require("../../utilities/SearchParams");
const Popup_1 = __importDefault(require("../Popup"));
require("./index.scss");
const baseClass = 'localizer';
const Localizer = () => {
    const { localization } = (0, Config_1.useConfig)();
    const locale = (0, Locale_1.useLocale)();
    const searchParams = (0, SearchParams_1.useSearchParams)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    if (localization) {
        const { locales } = localization;
        return (react_1.default.createElement("div", { className: baseClass },
            react_1.default.createElement(Popup_1.default, { horizontalAlign: "left", button: locale, render: ({ close }) => (react_1.default.createElement("div", null,
                    react_1.default.createElement("span", null, t('locales')),
                    react_1.default.createElement("ul", null, locales.map((localeOption) => {
                        const baseLocaleClass = `${baseClass}__locale`;
                        const localeClasses = [
                            baseLocaleClass,
                            locale === localeOption && `${baseLocaleClass}--active`,
                        ];
                        const newParams = {
                            ...searchParams,
                            locale: localeOption,
                        };
                        const search = qs_1.default.stringify(newParams);
                        if (localeOption !== locale) {
                            return (react_1.default.createElement("li", { key: localeOption, className: localeClasses.join(' ') },
                                react_1.default.createElement(react_router_dom_1.Link, { to: { search }, onClick: close }, localeOption)));
                        }
                        return null;
                    })))) })));
    }
    return null;
};
exports.default = Localizer;
//# sourceMappingURL=index.js.map