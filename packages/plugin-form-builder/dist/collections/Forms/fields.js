const name = {
    name: 'name',
    type: 'text',
    label: 'Name (lowercase, no special characters)',
    required: true
};
const label = {
    name: 'label',
    type: 'text',
    label: 'Label',
    localized: true
};
const required = {
    name: 'required',
    type: 'checkbox',
    label: 'Required'
};
const width = {
    name: 'width',
    type: 'number',
    label: 'Field Width (percentage)'
};
const placeholder = {
    name: 'placeholder',
    type: 'text',
    label: 'Placeholder'
};
const Radio = {
    slug: 'radio',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...width,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    name: 'defaultValue',
                    type: 'text',
                    admin: {
                        width: '50%'
                    },
                    label: 'Default Value',
                    localized: true
                }
            ]
        },
        {
            name: 'options',
            type: 'array',
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'label',
                            type: 'text',
                            admin: {
                                width: '50%'
                            },
                            label: 'Label',
                            localized: true,
                            required: true
                        },
                        {
                            name: 'value',
                            type: 'text',
                            admin: {
                                width: '50%'
                            },
                            label: 'Value',
                            required: true
                        }
                    ]
                }
            ],
            label: 'Radio Attribute Options',
            labels: {
                plural: 'Options',
                singular: 'Option'
            }
        },
        required
    ],
    labels: {
        plural: 'Radio Fields',
        singular: 'Radio'
    }
};
const Select = {
    slug: 'select',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...width,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    name: 'defaultValue',
                    type: 'text',
                    admin: {
                        width: '50%'
                    },
                    label: 'Default Value',
                    localized: true
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...placeholder
                }
            ]
        },
        {
            name: 'options',
            type: 'array',
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'label',
                            type: 'text',
                            admin: {
                                width: '50%'
                            },
                            label: 'Label',
                            localized: true,
                            required: true
                        },
                        {
                            name: 'value',
                            type: 'text',
                            admin: {
                                width: '50%'
                            },
                            label: 'Value',
                            required: true
                        }
                    ]
                }
            ],
            label: 'Select Attribute Options',
            labels: {
                plural: 'Options',
                singular: 'Option'
            }
        },
        required
    ],
    labels: {
        plural: 'Select Fields',
        singular: 'Select'
    }
};
const Text = {
    slug: 'text',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...width,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    name: 'defaultValue',
                    type: 'text',
                    admin: {
                        width: '50%'
                    },
                    label: 'Default Value',
                    localized: true
                }
            ]
        },
        required
    ],
    labels: {
        plural: 'Text Fields',
        singular: 'Text'
    }
};
const TextArea = {
    slug: 'textarea',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...width,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    name: 'defaultValue',
                    type: 'text',
                    admin: {
                        width: '50%'
                    },
                    label: 'Default Value',
                    localized: true
                }
            ]
        },
        required
    ],
    labels: {
        plural: 'Text Area Fields',
        singular: 'Text Area'
    }
};
const Number = {
    slug: 'number',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...width,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    name: 'defaultValue',
                    type: 'number',
                    admin: {
                        width: '50%'
                    },
                    label: 'Default Value'
                }
            ]
        },
        required
    ],
    labels: {
        plural: 'Number Fields',
        singular: 'Number'
    }
};
const Email = {
    slug: 'email',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        width,
        required
    ],
    labels: {
        plural: 'Email Fields',
        singular: 'Email'
    }
};
const State = {
    slug: 'state',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        width,
        required
    ],
    labels: {
        plural: 'State Fields',
        singular: 'State'
    }
};
const Country = {
    slug: 'country',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        width,
        required
    ],
    labels: {
        plural: 'Country Fields',
        singular: 'Country'
    }
};
const Checkbox = {
    slug: 'checkbox',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...width,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...required,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            name: 'defaultValue',
            type: 'checkbox',
            label: 'Default Value'
        }
    ],
    labels: {
        plural: 'Checkbox Fields',
        singular: 'Checkbox'
    }
};
const Date = {
    slug: 'date',
    fields: [
        {
            type: 'row',
            fields: [
                {
                    ...name,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...label,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            type: 'row',
            fields: [
                {
                    ...width,
                    admin: {
                        width: '50%'
                    }
                },
                {
                    ...required,
                    admin: {
                        width: '50%'
                    }
                }
            ]
        },
        {
            name: 'defaultValue',
            type: 'date',
            label: 'Default Value'
        }
    ],
    labels: {
        plural: 'Date Fields',
        singular: 'Date'
    }
};
const Payment = (fieldConfig)=>{
    let paymentProcessorField = null;
    if (fieldConfig?.paymentProcessor) {
        paymentProcessorField = {
            name: 'paymentProcessor',
            type: 'select',
            label: 'Payment Processor',
            options: [],
            ...fieldConfig.paymentProcessor
        };
    }
    const fields = {
        slug: 'payment',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        ...name,
                        admin: {
                            width: '50%'
                        }
                    },
                    {
                        ...label,
                        admin: {
                            width: '50%'
                        }
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        ...width,
                        admin: {
                            width: '50%'
                        }
                    },
                    {
                        name: 'basePrice',
                        type: 'number',
                        admin: {
                            width: '50%'
                        },
                        label: 'Base Price'
                    }
                ]
            },
            paymentProcessorField,
            {
                name: 'priceConditions',
                type: 'array',
                fields: [
                    {
                        name: 'fieldToUse',
                        type: 'text',
                        admin: {
                            components: {
                                Field: '@payloadcms/plugin-form-builder/client#DynamicFieldSelector'
                            }
                        }
                    },
                    {
                        name: 'condition',
                        type: 'select',
                        defaultValue: 'hasValue',
                        label: 'Condition',
                        options: [
                            {
                                label: 'Has Any Value',
                                value: 'hasValue'
                            },
                            {
                                label: 'Equals',
                                value: 'equals'
                            },
                            {
                                label: 'Does Not Equal',
                                value: 'notEquals'
                            }
                        ]
                    },
                    {
                        name: 'valueForCondition',
                        type: 'text',
                        admin: {
                            condition: (_, { condition })=>condition === 'equals' || condition === 'notEquals'
                        },
                        label: 'Value'
                    },
                    {
                        name: 'operator',
                        type: 'select',
                        defaultValue: 'add',
                        options: [
                            {
                                label: 'Add',
                                value: 'add'
                            },
                            {
                                label: 'Subtract',
                                value: 'subtract'
                            },
                            {
                                label: 'Multiply',
                                value: 'multiply'
                            },
                            {
                                label: 'Divide',
                                value: 'divide'
                            }
                        ]
                    },
                    {
                        name: 'valueType',
                        type: 'radio',
                        admin: {
                            width: '100%'
                        },
                        defaultValue: 'static',
                        label: 'Value Type',
                        options: [
                            {
                                label: 'Static Value',
                                value: 'static'
                            },
                            {
                                label: 'Value Of Field',
                                value: 'valueOfField'
                            }
                        ]
                    },
                    {
                        name: 'valueForOperator',
                        type: 'text',
                        admin: {
                            components: {
                                Field: '@payloadcms/plugin-form-builder/client#DynamicPriceSelector'
                            }
                        },
                        label: 'Value'
                    }
                ],
                label: 'Price Conditions',
                labels: {
                    plural: 'Price Conditions',
                    singular: 'Price Condition'
                }
            },
            required
        ].filter(Boolean),
        labels: {
            plural: 'Payment Fields',
            singular: 'Payment'
        }
    };
    return fields;
};
const Message = {
    slug: 'message',
    fields: [
        {
            name: 'message',
            type: 'richText',
            localized: true
        }
    ],
    labels: {
        plural: 'Message Blocks',
        singular: 'Message'
    }
};
export const fields = {
    checkbox: Checkbox,
    country: Country,
    date: Date,
    email: Email,
    message: Message,
    number: Number,
    payment: Payment,
    radio: Radio,
    select: Select,
    state: State,
    text: Text,
    textarea: TextArea
};

//# sourceMappingURL=fields.js.map