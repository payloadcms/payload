"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const Form_1 = __importDefault(require("../../forms/Form"));
const RenderFields_1 = __importDefault(require("../../forms/RenderFields"));
const field_types_1 = __importDefault(require("../../forms/field-types"));
const Submit_1 = __importDefault(require("../../forms/Submit"));
require("./index.scss");
const baseClass = 'create-first-user';
const CreateFirstUser = (props) => {
    const { setInitialized } = props;
    const { setToken } = (0, Auth_1.useAuth)();
    const { admin: { user: userSlug }, collections, serverURL, routes: { admin, api }, } = (0, Config_1.useConfig)();
    const { t } = (0, react_i18next_1.useTranslation)('authentication');
    const userConfig = collections.find((collection) => collection.slug === userSlug);
    const onSuccess = (json) => {
        var _a;
        if ((_a = json === null || json === void 0 ? void 0 : json.user) === null || _a === void 0 ? void 0 : _a.token) {
            setToken(json.user.token);
        }
        setInitialized(true);
    };
    const fields = [
        {
            name: 'email',
            label: t('general:emailAddress'),
            type: 'email',
            required: true,
        }, {
            name: 'password',
            label: t('general:password'),
            type: 'password',
            required: true,
        }, {
            name: 'confirm-password',
            label: t('confirmPassword'),
            type: 'confirmPassword',
            required: true,
        },
    ];
    return (react_1.default.createElement(Minimal_1.default, { className: baseClass },
        react_1.default.createElement("h1", null, t('general:welcome')),
        react_1.default.createElement("p", null, t('beginCreateFirstUser')),
        react_1.default.createElement(Meta_1.default, { title: t('createFirstUser'), description: t('createFirstUser'), keywords: t('general:create') }),
        react_1.default.createElement(Form_1.default, { onSuccess: onSuccess, method: "post", redirect: admin, action: `${serverURL}${api}/${userSlug}/first-register`, validationOperation: "create" },
            react_1.default.createElement(RenderFields_1.default, { fieldSchema: [
                    ...fields,
                    ...userConfig.fields,
                ], fieldTypes: field_types_1.default }),
            react_1.default.createElement(Submit_1.default, null, t('general:create')))));
};
exports.default = CreateFirstUser;
//# sourceMappingURL=index.js.map