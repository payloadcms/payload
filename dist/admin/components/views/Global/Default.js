"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Eyebrow_1 = __importDefault(require("../../elements/Eyebrow"));
const Form_1 = __importDefault(require("../../forms/Form"));
const PreviewButton_1 = __importDefault(require("../../elements/PreviewButton"));
const Submit_1 = __importDefault(require("../../forms/Submit"));
const RenderFields_1 = __importDefault(require("../../forms/RenderFields"));
const CopyToClipboard_1 = __importDefault(require("../../elements/CopyToClipboard"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const field_types_1 = __importDefault(require("../../forms/field-types"));
const LeaveWithoutSaving_1 = __importDefault(require("../../modals/LeaveWithoutSaving"));
const VersionsCount_1 = __importDefault(require("../../elements/VersionsCount"));
const ViewDescription_1 = __importDefault(require("../../elements/ViewDescription"));
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const SaveDraft_1 = __importDefault(require("../../elements/SaveDraft"));
const Publish_1 = __importDefault(require("../../elements/Publish"));
const Status_1 = __importDefault(require("../../elements/Status"));
const Autosave_1 = __importDefault(require("../../elements/Autosave"));
const OperationProvider_1 = require("../../utilities/OperationProvider");
const Gutter_1 = require("../../elements/Gutter");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Loading_1 = require("../../elements/Loading");
const formatDate_1 = require("../../../utilities/formatDate");
require("./index.scss");
const baseClass = 'global-edit';
const DefaultGlobalView = (props) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const { global, data, onSave, permissions, action, apiURL, initialState, isLoading, updatedAt, } = props;
    const { admin: { dateFormat } } = (0, Config_1.useConfig)();
    const { publishedDoc } = (0, DocumentInfo_1.useDocumentInfo)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const { fields, versions, label, admin: { description, hideAPIURL, preview, } = {}, } = global;
    const hasSavePermission = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.update) === null || _a === void 0 ? void 0 : _a.permission;
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(OperationProvider_1.OperationContext.Provider, { value: "update" },
            react_1.default.createElement(Form_1.default, { className: `${baseClass}__form`, method: "post", action: action, onSuccess: onSave, disabled: !hasSavePermission, initialState: initialState },
                react_1.default.createElement(Loading_1.FormLoadingOverlayToggle, { action: "update", name: `global-edit--${label}`, loadingSuffix: (0, getTranslation_1.getTranslation)(label, i18n) }),
                !isLoading && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement("div", { className: `${baseClass}__main` },
                        react_1.default.createElement(Meta_1.default, { title: (0, getTranslation_1.getTranslation)(label, i18n), description: (0, getTranslation_1.getTranslation)(label, i18n), keywords: `${(0, getTranslation_1.getTranslation)(label, i18n)}, Payload, CMS` }),
                        react_1.default.createElement(Eyebrow_1.default, null),
                        !(((_b = global.versions) === null || _b === void 0 ? void 0 : _b.drafts) && ((_d = (_c = global.versions) === null || _c === void 0 ? void 0 : _c.drafts) === null || _d === void 0 ? void 0 : _d.autosave)) && (react_1.default.createElement(LeaveWithoutSaving_1.default, null)),
                        react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__edit` },
                            react_1.default.createElement("header", { className: `${baseClass}__header` },
                                react_1.default.createElement("h1", null, t('editLabel', { label: (0, getTranslation_1.getTranslation)(label, i18n) })),
                                description && (react_1.default.createElement("div", { className: `${baseClass}__sub-header` },
                                    react_1.default.createElement(ViewDescription_1.default, { description: description })))),
                            react_1.default.createElement(RenderFields_1.default, { readOnly: !hasSavePermission, permissions: permissions.fields, filter: (field) => (!field.admin.position || (field.admin.position && field.admin.position !== 'sidebar')), fieldTypes: field_types_1.default, fieldSchema: fields }))),
                    react_1.default.createElement("div", { className: `${baseClass}__sidebar-wrap` },
                        react_1.default.createElement("div", { className: `${baseClass}__sidebar` },
                            react_1.default.createElement("div", { className: `${baseClass}__sidebar-sticky-wrap` },
                                react_1.default.createElement("div", { className: `${baseClass}__document-actions${((((_e = global.versions) === null || _e === void 0 ? void 0 : _e.drafts) && !((_g = (_f = global.versions) === null || _f === void 0 ? void 0 : _f.drafts) === null || _g === void 0 ? void 0 : _g.autosave)) || preview) ? ` ${baseClass}__document-actions--has-2` : ''}` },
                                    (preview && (!((_h = global.versions) === null || _h === void 0 ? void 0 : _h.drafts) || ((_k = (_j = global.versions) === null || _j === void 0 ? void 0 : _j.drafts) === null || _k === void 0 ? void 0 : _k.autosave))) && (react_1.default.createElement(PreviewButton_1.default, { generatePreviewURL: preview })),
                                    hasSavePermission && (react_1.default.createElement(react_1.default.Fragment, null,
                                        ((_l = global.versions) === null || _l === void 0 ? void 0 : _l.drafts) && (react_1.default.createElement(react_1.default.Fragment, null,
                                            !global.versions.drafts.autosave && (react_1.default.createElement(SaveDraft_1.default, null)),
                                            react_1.default.createElement(Publish_1.default, null))),
                                        !((_m = global.versions) === null || _m === void 0 ? void 0 : _m.drafts) && (react_1.default.createElement(Submit_1.default, { buttonId: "action-save" }, t('save')))))),
                                react_1.default.createElement("div", { className: `${baseClass}__sidebar-fields` },
                                    (preview && (((_o = global.versions) === null || _o === void 0 ? void 0 : _o.drafts) && !((_q = (_p = global.versions) === null || _p === void 0 ? void 0 : _p.drafts) === null || _q === void 0 ? void 0 : _q.autosave))) && (react_1.default.createElement(PreviewButton_1.default, { generatePreviewURL: preview })),
                                    ((_r = global.versions) === null || _r === void 0 ? void 0 : _r.drafts) && (react_1.default.createElement(react_1.default.Fragment, null,
                                        react_1.default.createElement(Status_1.default, null),
                                        (global.versions.drafts.autosave && hasSavePermission) && (react_1.default.createElement(Autosave_1.default, { publishedDocUpdatedAt: (publishedDoc === null || publishedDoc === void 0 ? void 0 : publishedDoc.updatedAt) || (data === null || data === void 0 ? void 0 : data.createdAt), global: global })))),
                                    react_1.default.createElement(RenderFields_1.default, { readOnly: !hasSavePermission, permissions: permissions.fields, filter: (field) => field.admin.position === 'sidebar', fieldTypes: field_types_1.default, fieldSchema: fields })),
                                react_1.default.createElement("ul", { className: `${baseClass}__meta` },
                                    versions && (react_1.default.createElement("li", null,
                                        react_1.default.createElement("div", { className: `${baseClass}__label` }, t('version:versions')),
                                        react_1.default.createElement(VersionsCount_1.default, { global: global }))),
                                    (data && !hideAPIURL) && (react_1.default.createElement("li", { className: `${baseClass}__api-url` },
                                        react_1.default.createElement("span", { className: `${baseClass}__label` },
                                            "API URL",
                                            ' ',
                                            react_1.default.createElement(CopyToClipboard_1.default, { value: apiURL })),
                                        react_1.default.createElement("a", { href: apiURL, target: "_blank", rel: "noopener noreferrer" }, apiURL))),
                                    updatedAt && (react_1.default.createElement("li", null,
                                        react_1.default.createElement("div", { className: `${baseClass}__label` }, t('lastModified')),
                                        react_1.default.createElement("div", null, (0, formatDate_1.formatDate)(updatedAt, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language))))))))))))));
};
exports.default = DefaultGlobalView;
//# sourceMappingURL=Default.js.map