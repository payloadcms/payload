import { inventoryField } from '../../fields/inventoryField.js';
import { pricesField } from '../../fields/pricesField.js';
import { variantsFields } from '../../fields/variantsFields.js';
export const createProductsCollection = (props)=>{
    const { access, currenciesConfig, enableVariants = false, inventory = true, variantsSlug = 'variants', variantTypesSlug = 'variantTypes' } = props || {};
    const fields = [
        ...inventory ? [
            inventoryField({
                overrides: {
                    admin: {
                        condition: ({ enableVariants })=>!enableVariants
                    }
                }
            })
        ] : [],
        ...enableVariants ? variantsFields({
            variantsSlug,
            variantTypesSlug
        }) : [],
        ...currenciesConfig ? [
            ...pricesField({
                currenciesConfig
            })
        ] : []
    ];
    const baseConfig = {
        slug: 'products',
        access: {
            create: access.isAdmin,
            delete: access.isAdmin,
            read: access.adminOrPublishedStatus,
            update: access.isAdmin
        },
        admin: {
            defaultColumns: [
                ...currenciesConfig ? [
                    'prices'
                ] : [],
                ...enableVariants ? [
                    'variants'
                ] : []
            ],
            group: 'Ecommerce'
        },
        fields,
        labels: {
            plural: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:products'),
            singular: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:product')
        },
        trash: true,
        versions: {
            drafts: {
                autosave: true
            }
        }
    };
    return baseConfig;
};

//# sourceMappingURL=createProductsCollection.js.map