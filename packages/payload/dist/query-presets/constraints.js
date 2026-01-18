import { getTranslation } from '@payloadcms/translations';
import { fieldAffectsData } from '../fields/config/types.js';
import { toWords } from '../utilities/formatLabels.js';
import { preventLockout } from './preventLockout.js';
import { operations } from './types.js';
const defaultConstraintOptions = [
    {
        label: 'Everyone',
        value: 'everyone'
    },
    {
        label: 'Only Me',
        value: 'onlyMe'
    },
    {
        label: 'Specific Users',
        value: 'specificUsers'
    }
];
export const getConstraints = (config)=>({
        name: 'access',
        type: 'group',
        admin: {
            components: {
                Cell: '@payloadcms/ui#QueryPresetsAccessCell'
            },
            condition: (data)=>Boolean(data?.isShared)
        },
        fields: operations.map((constraintOperation)=>({
                type: 'collapsible',
                fields: [
                    {
                        name: constraintOperation,
                        type: 'group',
                        admin: {
                            hideGutter: true
                        },
                        fields: [
                            {
                                name: 'constraint',
                                type: 'select',
                                defaultValue: 'onlyMe',
                                filterOptions: (args)=>typeof config?.queryPresets?.filterConstraints === 'function' ? config.queryPresets.filterConstraints(args) : args.options,
                                label: ({ i18n })=>`Specify who can ${constraintOperation} this ${getTranslation(config.queryPresets?.labels?.singular || 'Preset', i18n)}`,
                                options: [
                                    ...defaultConstraintOptions,
                                    ...config?.queryPresets?.constraints?.[constraintOperation]?.map((option)=>({
                                            label: option.label,
                                            value: option.value
                                        })) || []
                                ]
                            },
                            {
                                name: 'users',
                                type: 'relationship',
                                admin: {
                                    condition: (data)=>Boolean(data?.access?.[constraintOperation]?.constraint === 'specificUsers')
                                },
                                hasMany: true,
                                hooks: {
                                    beforeChange: [
                                        ({ data, req })=>{
                                            if (data?.access?.[constraintOperation]?.constraint === 'onlyMe' && req.user) {
                                                return [
                                                    req.user.id
                                                ];
                                            }
                                            if (data?.access?.[constraintOperation]?.constraint === 'specificUsers' && req.user) {
                                                return [
                                                    ...data?.access?.[constraintOperation]?.users || [],
                                                    req.user.id
                                                ];
                                            }
                                        }
                                    ]
                                },
                                relationTo: config.admin?.user ?? 'users'
                            },
                            ...config?.queryPresets?.constraints?.[constraintOperation]?.reduce((acc, option)=>{
                                option.fields?.forEach((field, index)=>{
                                    acc.push({
                                        ...field
                                    });
                                    if (fieldAffectsData(field)) {
                                        acc[index].admin = {
                                            ...acc[index]?.admin || {},
                                            condition: (data)=>Boolean(data?.access?.[constraintOperation]?.constraint === option.value)
                                        };
                                    }
                                });
                                return acc;
                            }, []) || []
                        ],
                        label: false
                    }
                ],
                label: ()=>toWords(constraintOperation)
            })),
        label: 'Sharing settings',
        validate: preventLockout
    });

//# sourceMappingURL=constraints.js.map