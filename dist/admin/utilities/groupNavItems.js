"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupNavItems = exports.EntityType = void 0;
const getTranslation_1 = require("../../utilities/getTranslation");
var EntityType;
(function (EntityType) {
    EntityType["collection"] = "collections";
    EntityType["global"] = "globals";
})(EntityType = exports.EntityType || (exports.EntityType = {}));
function groupNavItems(entities, permissions, i18n) {
    const result = entities.reduce((groups, entityToGroup) => {
        var _a, _b;
        if ((_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions[entityToGroup.type.toLowerCase()]) === null || _a === void 0 ? void 0 : _a[entityToGroup.entity.slug]) === null || _b === void 0 ? void 0 : _b.read.permission) {
            const translatedGroup = (0, getTranslation_1.getTranslation)(entityToGroup.entity.admin.group, i18n);
            if (entityToGroup.entity.admin.group) {
                const existingGroup = groups.find((group) => (0, getTranslation_1.getTranslation)(group.label, i18n) === translatedGroup);
                let matchedGroup = existingGroup;
                if (!existingGroup) {
                    matchedGroup = { label: translatedGroup, entities: [] };
                    groups.push(matchedGroup);
                }
                matchedGroup.entities.push(entityToGroup);
            }
            else {
                const defaultGroup = groups.find((group) => (0, getTranslation_1.getTranslation)(group.label, i18n) === i18n.t(`general:${entityToGroup.type}`));
                defaultGroup.entities.push(entityToGroup);
            }
        }
        return groups;
    }, [
        {
            label: i18n.t('general:collections'),
            entities: [],
        },
        {
            label: i18n.t('general:globals'),
            entities: [],
        },
    ]);
    return result.filter((group) => group.entities.length > 0);
}
exports.groupNavItems = groupNavItems;
//# sourceMappingURL=groupNavItems.js.map