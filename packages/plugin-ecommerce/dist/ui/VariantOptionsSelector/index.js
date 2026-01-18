import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldLabel } from '@payloadcms/ui';
import { ErrorBox } from './ErrorBox.js';
import './index.css';
import { OptionsSelect } from './OptionsSelect.js';
export const VariantOptionsSelector = async (props)=>{
    const { clientField, data, field, path, req, user } = props;
    const { label } = clientField;
    // Get collection slugs from field custom prop, with defaults for backwards compatibility
    const productsSlug = field.custom?.productsSlug || 'products';
    const variantTypesSlug = field.custom?.variantTypesSlug || 'variantTypes';
    const product = await req.payload.findByID({
        id: data.product,
        collection: productsSlug,
        depth: 0,
        draft: true,
        select: {
            variants: true,
            variantTypes: true
        },
        user
    });
    // @ts-expect-error - TODO: Fix types
    const existingVariantOptions = product.variants?.docs?.map((variant)=>variant.options) ?? [];
    const variantTypeIDs = product.variantTypes;
    const variantTypes = [];
    // Need to get the variant types separately so that the options are populated
    // @ts-expect-error - TODO: Fix types
    if (variantTypeIDs?.length && variantTypeIDs.length > 0) {
        // @ts-expect-error - TODO: Fix types
        for (const variantTypeID of variantTypeIDs){
            const variantType = await req.payload.findByID({
                id: variantTypeID,
                collection: variantTypesSlug,
                depth: 1,
                joins: {
                    options: {
                        sort: 'value'
                    }
                }
            });
            if (variantType) {
                variantTypes.push(variantType);
            }
        }
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "variantOptionsSelector",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "variantOptionsSelectorHeading",
                children: /*#__PURE__*/ _jsx(FieldLabel, {
                    as: "span",
                    label: label
                })
            }),
            /*#__PURE__*/ _jsx(ErrorBox, {
                existingOptions: existingVariantOptions,
                path: path,
                children: /*#__PURE__*/ _jsx("div", {
                    className: "variantOptionsSelectorList",
                    children: variantTypes.map((type)=>{
                        // @ts-expect-error - TODO: Fix types
                        const options = type.options.docs.map((option)=>({
                                label: option.label,
                                value: option.id
                            }));
                        return /*#__PURE__*/ _jsx(OptionsSelect, {
                            field: clientField,
                            label: type.label || type.name,
                            options: options,
                            path: path
                        }, type.name);
                    })
                })
            })
        ]
    });
};

//# sourceMappingURL=index.js.map