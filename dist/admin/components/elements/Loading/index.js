"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormLoadingOverlayToggle = exports.LoadingOverlayToggle = exports.LoadingOverlay = void 0;
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const context_1 = require("../../forms/Form/context");
const LoadingOverlay_1 = require("../../utilities/LoadingOverlay");
require("./index.scss");
const baseClass = 'loading-overlay';
const LoadingOverlay = ({ loadingText, show = true, overlayType, animationDuration }) => {
    const { t } = (0, react_i18next_1.useTranslation)('general');
    return (react_1.default.createElement("div", { className: [
            baseClass,
            show ? `${baseClass}--entering` : `${baseClass}--exiting`,
            overlayType ? `${baseClass}--${overlayType}` : '',
        ].filter(Boolean).join(' '), style: {
            animationDuration: animationDuration || '500ms',
        } },
        react_1.default.createElement("div", { className: `${baseClass}__bars` },
            react_1.default.createElement("div", { className: `${baseClass}__bar` }),
            react_1.default.createElement("div", { className: `${baseClass}__bar` }),
            react_1.default.createElement("div", { className: `${baseClass}__bar` }),
            react_1.default.createElement("div", { className: `${baseClass}__bar` }),
            react_1.default.createElement("div", { className: `${baseClass}__bar` })),
        react_1.default.createElement("span", { className: `${baseClass}__text` }, loadingText || t('loading'))));
};
exports.LoadingOverlay = LoadingOverlay;
const LoadingOverlayToggle = ({ name: key, show, type = 'fullscreen', loadingText }) => {
    const { toggleLoadingOverlay } = (0, LoadingOverlay_1.useLoadingOverlay)();
    react_1.default.useEffect(() => {
        toggleLoadingOverlay({
            key,
            isLoading: show,
            type,
            loadingText: loadingText || undefined,
        });
        return () => {
            toggleLoadingOverlay({
                key,
                isLoading: false,
                type,
            });
        };
    }, [show, toggleLoadingOverlay, key, type, loadingText]);
    return null;
};
exports.LoadingOverlayToggle = LoadingOverlayToggle;
const FormLoadingOverlayToggle = ({ name, formIsLoading = false, action, type = 'fullscreen', loadingSuffix }) => {
    const isProcessing = (0, context_1.useFormProcessing)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const labels = {
        create: t('creating'),
        update: t('updating'),
        loading: t('loading'),
    };
    return (react_1.default.createElement(exports.LoadingOverlayToggle, { name: name, show: formIsLoading || isProcessing, type: type, loadingText: `${labels[action]} ${loadingSuffix ? (0, getTranslation_1.getTranslation)(loadingSuffix, i18n) : ''}`.trim() }));
};
exports.FormLoadingOverlayToggle = FormLoadingOverlayToggle;
//# sourceMappingURL=index.js.map