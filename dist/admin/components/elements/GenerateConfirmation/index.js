"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_toastify_1 = require("react-toastify");
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const Button_1 = __importDefault(require("../Button"));
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
require("./index.scss");
const baseClass = 'generate-confirmation';
const GenerateConfirmation = (props) => {
    const { setKey, highlightField, } = props;
    const { id } = (0, DocumentInfo_1.useDocumentInfo)();
    const { toggleModal } = (0, modal_1.useModal)();
    const { t } = (0, react_i18next_1.useTranslation)('authentication');
    const modalSlug = `generate-confirmation-${id}`;
    const handleGenerate = () => {
        setKey();
        toggleModal(modalSlug);
        react_toastify_1.toast.success(t('newAPIKeyGenerated'), { autoClose: 3000 });
        highlightField(true);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Button_1.default, { size: "small", buttonStyle: "secondary", onClick: () => {
                toggleModal(modalSlug);
            } }, t('generateNewAPIKey')),
        react_1.default.createElement(modal_1.Modal, { slug: modalSlug, className: baseClass },
            react_1.default.createElement(Minimal_1.default, { className: `${baseClass}__template` },
                react_1.default.createElement("h1", null, t('confirmGeneration')),
                react_1.default.createElement("p", null,
                    react_1.default.createElement(react_i18next_1.Trans, { i18nKey: "generatingNewAPIKeyWillInvalidate", t: t },
                        "generatingNewAPIKeyWillInvalidate",
                        react_1.default.createElement("strong", null, "invalidate"))),
                react_1.default.createElement(Button_1.default, { buttonStyle: "secondary", type: "button", onClick: () => {
                        toggleModal(modalSlug);
                    } }, t('general:cancel')),
                react_1.default.createElement(Button_1.default, { onClick: handleGenerate }, t('generate'))))));
};
exports.default = GenerateConfirmation;
//# sourceMappingURL=index.js.map