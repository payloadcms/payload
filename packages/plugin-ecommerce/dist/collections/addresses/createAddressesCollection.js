import { accessOR } from '../../utilities/accessComposition.js';
import { defaultCountries } from './defaultCountries.js';
import { beforeChange } from './hooks/beforeChange.js';
export const createAddressesCollection = (props)=>{
    const { access, addressFields, customersSlug = 'users' } = props || {};
    const { supportedCountries: supportedCountriesFromProps } = props || {};
    const supportedCountries = supportedCountriesFromProps || defaultCountries;
    const hasOnlyOneCountry = supportedCountries && supportedCountries.length === 1;
    const fields = [
        {
            name: 'customer',
            type: 'relationship',
            admin: {
                position: 'sidebar'
            },
            label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:customer'),
            relationTo: customersSlug
        },
        ...addressFields.map((field)=>{
            if ('name' in field && field.name === 'country') {
                return {
                    name: 'country',
                    type: 'select',
                    label: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                        t('plugin-ecommerce:addressCountry'),
                    options: supportedCountries || defaultCountries,
                    required: true,
                    ...supportedCountries && supportedCountries?.[0] && hasOnlyOneCountry ? {
                        defaultValue: supportedCountries?.[0].value
                    } : {}
                };
            }
            return field;
        })
    ];
    const baseConfig = {
        slug: 'addresses',
        access: {
            create: access.isAuthenticated,
            delete: accessOR(access.isAdmin, access.isDocumentOwner),
            read: accessOR(access.isAdmin, access.isDocumentOwner),
            update: accessOR(access.isAdmin, access.isDocumentOwner)
        },
        admin: {
            description: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:addressesCollectionDescription'),
            group: 'Ecommerce',
            hidden: true,
            useAsTitle: 'createdAt'
        },
        fields,
        hooks: {
            beforeChange: [
                beforeChange({
                    isCustomer: access.isCustomer ?? access.customerOnlyFieldAccess
                })
            ]
        },
        labels: {
            plural: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:addresses'),
            singular: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:address')
        },
        timestamps: true
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=createAddressesCollection.js.map