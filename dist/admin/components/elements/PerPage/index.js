"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const qs_1 = __importDefault(require("qs"));
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const SearchParams_1 = require("../../utilities/SearchParams");
const Popup_1 = __importDefault(require("../Popup"));
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const defaults_1 = require("../../../../collections/config/defaults");
require("./index.scss");
const baseClass = 'per-page';
const defaultLimits = defaults_1.defaults.admin.pagination.limits;
const PerPage = ({ limits = defaultLimits, limit, handleChange, modifySearchParams = true, resetPage = false }) => {
    const params = (0, SearchParams_1.useSearchParams)();
    const history = (0, react_router_dom_1.useHistory)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Popup_1.default, { horizontalAlign: "right", button: (react_1.default.createElement("strong", null,
                t('perPage', { limit }),
                react_1.default.createElement(Chevron_1.default, null))), render: ({ close }) => (react_1.default.createElement("div", null,
                react_1.default.createElement("ul", null, limits.map((limitNumber, i) => (react_1.default.createElement("li", { className: `${baseClass}-item`, key: i },
                    react_1.default.createElement("button", { type: "button", className: [
                            `${baseClass}__button`,
                            limitNumber === Number(limit) && `${baseClass}__button-active`,
                        ].filter(Boolean).join(' '), onClick: () => {
                            close();
                            if (handleChange)
                                handleChange(limitNumber);
                            if (modifySearchParams) {
                                history.replace({
                                    search: qs_1.default.stringify({
                                        ...params,
                                        page: resetPage ? 1 : params.page,
                                        limit: limitNumber,
                                    }, { addQueryPrefix: true }),
                                });
                            }
                        } },
                        limitNumber === Number(limit) && (react_1.default.createElement(Chevron_1.default, null)),
                        limitNumber))))))) })));
};
exports.default = PerPage;
//# sourceMappingURL=index.js.map