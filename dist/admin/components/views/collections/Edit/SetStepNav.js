"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetStepNav = void 0;
const react_1 = require("react");
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const useTitle_1 = __importDefault(require("../../../../hooks/useTitle"));
const StepNav_1 = require("../../../elements/StepNav");
const Config_1 = require("../../../utilities/Config");
const SetStepNav = ({ collection, isEditing, id }) => {
    const { slug, labels: { plural: pluralLabel, }, admin: { useAsTitle, }, } = collection;
    const { setStepNav } = (0, StepNav_1.useStepNav)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const { routes: { admin } } = (0, Config_1.useConfig)();
    const title = (0, useTitle_1.default)(collection);
    (0, react_1.useEffect)(() => {
        const nav = [{
                url: `${admin}/collections/${slug}`,
                label: (0, getTranslation_1.getTranslation)(pluralLabel, i18n),
            }];
        if (isEditing) {
            nav.push({
                label: (useAsTitle && useAsTitle !== 'id') ? title || `[${t('untitled')}]` : id,
            });
        }
        else {
            nav.push({
                label: t('createNew'),
            });
        }
        setStepNav(nav);
    }, [setStepNav, isEditing, pluralLabel, id, slug, useAsTitle, admin, t, i18n, title]);
    return null;
};
exports.SetStepNav = SetStepNav;
//# sourceMappingURL=SetStepNav.js.map