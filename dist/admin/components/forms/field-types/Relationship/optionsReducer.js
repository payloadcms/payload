"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const useTitle_1 = require("../../../../hooks/useTitle");
const reduceToIDs = (options) => options.reduce((ids, option) => {
    if (option.options) {
        return [
            ...ids,
            ...reduceToIDs(option.options),
        ];
    }
    return [
        ...ids,
        option.value,
    ];
}, []);
const sortOptions = (options) => options.sort((a, b) => {
    var _a, _b;
    if (typeof ((_a = a === null || a === void 0 ? void 0 : a.label) === null || _a === void 0 ? void 0 : _a.localeCompare) === 'function' && typeof ((_b = b === null || b === void 0 ? void 0 : b.label) === null || _b === void 0 ? void 0 : _b.localeCompare) === 'function') {
        return a.label.localeCompare(b.label);
    }
    return 0;
});
const optionsReducer = (state, action) => {
    var _a;
    switch (action.type) {
        case 'CLEAR': {
            return [];
        }
        case 'UPDATE': {
            const { collection, doc, i18n, config } = action;
            const relation = collection.slug;
            const newOptions = [...state];
            const docTitle = (0, useTitle_1.formatUseAsTitle)({
                doc,
                collection,
                i18n,
                config,
            });
            const foundOptionGroup = newOptions.find((optionGroup) => optionGroup.label === collection.labels.plural);
            const foundOption = (_a = foundOptionGroup === null || foundOptionGroup === void 0 ? void 0 : foundOptionGroup.options) === null || _a === void 0 ? void 0 : _a.find((option) => option.value === doc.id);
            if (foundOption) {
                foundOption.label = docTitle || `${i18n.t('general:untitled')} - ID: ${doc.id}`;
                foundOption.relationTo = relation;
            }
            return newOptions;
        }
        case 'ADD': {
            const { collection, docs, sort, ids = [], i18n, config } = action;
            const relation = collection.slug;
            const loadedIDs = reduceToIDs(state);
            const newOptions = [...state];
            const optionsToAddTo = newOptions.find((optionGroup) => optionGroup.label === collection.labels.plural);
            const newSubOptions = docs.reduce((docSubOptions, doc) => {
                if (loadedIDs.indexOf(doc.id) === -1) {
                    loadedIDs.push(doc.id);
                    const docTitle = (0, useTitle_1.formatUseAsTitle)({
                        doc,
                        collection,
                        i18n,
                        config,
                    });
                    return [
                        ...docSubOptions,
                        {
                            label: docTitle || `${i18n.t('general:untitled')} - ID: ${doc.id}`,
                            relationTo: relation,
                            value: doc.id,
                        },
                    ];
                }
                return docSubOptions;
            }, []);
            ids.forEach((id) => {
                if (!loadedIDs.includes(id)) {
                    newSubOptions.push({
                        relationTo: relation,
                        label: `${i18n.t('general:untitled')} - ID: ${id}`,
                        value: id,
                    });
                }
            });
            if (optionsToAddTo) {
                const subOptions = [
                    ...optionsToAddTo.options,
                    ...newSubOptions,
                ];
                optionsToAddTo.options = sort ? sortOptions(subOptions) : subOptions;
            }
            else {
                newOptions.push({
                    label: (0, getTranslation_1.getTranslation)(collection.labels.plural, i18n),
                    options: sort ? sortOptions(newSubOptions) : newSubOptions,
                });
            }
            return newOptions;
        }
        default: {
            return state;
        }
    }
};
exports.default = optionsReducer;
//# sourceMappingURL=optionsReducer.js.map