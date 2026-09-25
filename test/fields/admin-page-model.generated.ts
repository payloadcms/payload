export const adminPageModel = {
  collections: {
    'array-fields': {
      slug: 'array-fields',
      fields: {
        title: {
          path: 'title',
          type: 'text',
          hasMany: false,
        },
        items: {
          path: 'items',
          required: true,
          type: 'array',
          fields: {
            text: {
              path: 'items.text',
              required: true,
              type: 'text',
              hasMany: false,
            },
            anotherText: {
              path: 'items.anotherText',
              type: 'text',
              hasMany: false,
            },
            uiField: {
              path: 'items.uiField',
              admin: {
                disabled: false,
                hidden: false,
                readOnly: false,
              },
              type: 'ui',
            },
            localizedText: {
              path: 'items.localizedText',
              type: 'text',
              hasMany: false,
            },
            richTextField: {
              path: 'items.richTextField',
              type: 'richText',
            },
            subArray: {
              path: 'items.subArray',
              type: 'array',
              fields: {
                text: {
                  path: 'items.subArray.text',
                  type: 'text',
                  hasMany: false,
                },
                textTwo: {
                  path: 'items.subArray.textTwo',
                  required: true,
                  type: 'text',
                  hasMany: false,
                },
                textInRow: {
                  path: 'items.subArray.textInRow',
                  required: true,
                  type: 'text',
                  hasMany: false,
                },
                id: {
                  path: 'items.subArray.id',
                  admin: {
                    disabled: false,
                    hidden: true,
                    readOnly: false,
                  },
                  type: 'text',
                  hasMany: false,
                },
              },
            },
            id: {
              path: 'items.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        collapsedArray: {
          path: 'collapsedArray',
          type: 'array',
          fields: {
            text: {
              path: 'collapsedArray.text',
              required: true,
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'collapsedArray.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        localized: {
          path: 'localized',
          required: true,
          type: 'array',
          fields: {
            text: {
              path: 'localized.text',
              required: true,
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'localized.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        readOnly: {
          path: 'readOnly',
          admin: {
            disabled: false,
            hidden: false,
            readOnly: true,
          },
          type: 'array',
          fields: {
            text: {
              path: 'readOnly.text',
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'readOnly.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        potentiallyEmptyArray: {
          path: 'potentiallyEmptyArray',
          type: 'array',
          fields: {
            text: {
              path: 'potentiallyEmptyArray.text',
              type: 'text',
              hasMany: false,
            },
            group: {
              path: 'potentiallyEmptyArray.group',
              type: 'group',
              fields: {
                text: {
                  path: 'potentiallyEmptyArray.group.text',
                  type: 'text',
                  hasMany: false,
                },
              },
            },
            array: {
              path: 'potentiallyEmptyArray.array',
              type: 'array',
              fields: {
                text: {
                  path: 'potentiallyEmptyArray.array.text',
                  type: 'text',
                  hasMany: false,
                },
                id: {
                  path: 'potentiallyEmptyArray.array.id',
                  admin: {
                    disabled: false,
                    hidden: true,
                    readOnly: false,
                  },
                  type: 'text',
                  hasMany: false,
                },
              },
            },
            id: {
              path: 'potentiallyEmptyArray.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        rowLabelAsComponent: {
          path: 'rowLabelAsComponent',
          type: 'array',
          fields: {
            title: {
              path: 'rowLabelAsComponent.title',
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'rowLabelAsComponent.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        arrayWithMinRows: {
          path: 'arrayWithMinRows',
          type: 'array',
          fields: {
            text: {
              path: 'arrayWithMinRows.text',
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'arrayWithMinRows.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        disableSort: {
          path: 'disableSort',
          type: 'array',
          fields: {
            text: {
              path: 'disableSort.text',
              required: true,
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'disableSort.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        nestedArrayLocalized: {
          path: 'nestedArrayLocalized',
          type: 'array',
          fields: {
            array: {
              path: 'nestedArrayLocalized.array',
              type: 'array',
              fields: {
                text: {
                  path: 'nestedArrayLocalized.array.text',
                  type: 'text',
                  hasMany: false,
                },
                id: {
                  path: 'nestedArrayLocalized.array.id',
                  admin: {
                    disabled: false,
                    hidden: true,
                    readOnly: false,
                  },
                  type: 'text',
                  hasMany: false,
                },
              },
            },
            id: {
              path: 'nestedArrayLocalized.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        externallyUpdatedArray: {
          path: 'externallyUpdatedArray',
          type: 'array',
          fields: {
            customTextField: {
              path: 'externallyUpdatedArray.customTextField',
              admin: {
                disabled: false,
                hidden: false,
                readOnly: false,
              },
              type: 'ui',
            },
            id: {
              path: 'externallyUpdatedArray.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        customArrayField: {
          path: 'customArrayField',
          type: 'array',
          fields: {
            text: {
              path: 'customArrayField.text',
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'customArrayField.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        ui: {
          path: 'ui',
          admin: {
            disabled: false,
            hidden: false,
            readOnly: false,
          },
          type: 'ui',
        },
        arrayWithLabels: {
          path: 'arrayWithLabels',
          type: 'array',
          fields: {
            text: {
              path: 'arrayWithLabels.text',
              type: 'text',
              hasMany: false,
            },
            id: {
              path: 'arrayWithLabels.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        arrayWithCustomID: {
          path: 'arrayWithCustomID',
          type: 'array',
          fields: {
            id: {
              path: 'arrayWithCustomID.id',
              admin: {
                disabled: false,
                hidden: false,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
            text: {
              path: 'arrayWithCustomID.text',
              type: 'text',
              hasMany: false,
            },
          },
        },
        getDataByPathTest: {
          path: 'getDataByPathTest',
          admin: {
            disabled: false,
            hidden: false,
            readOnly: false,
          },
          type: 'ui',
        },
        updatedAt: {
          path: 'updatedAt',
          admin: {
            disabled: false,
            hidden: true,
            readOnly: false,
          },
          type: 'date',
        },
        createdAt: {
          path: 'createdAt',
          admin: {
            disabled: false,
            hidden: true,
            readOnly: false,
          },
          type: 'date',
        },
      },
    },
    'relationship-fields': {
      slug: 'relationship-fields',
      fields: {
        text: {
          path: 'text',
          type: 'text',
          hasMany: false,
        },
        relationship: {
          path: 'relationship',
          required: true,
          type: 'relationship',
          hasMany: false,
          relationTo: ['text-fields', 'array-fields'],
        },
        relationHasManyPolymorphic: {
          path: 'relationHasManyPolymorphic',
          type: 'relationship',
          hasMany: true,
          relationTo: ['text-fields', 'array-fields'],
        },
        relationToSelf: {
          path: 'relationToSelf',
          type: 'relationship',
          hasMany: false,
          relationTo: ['relationship-fields'],
        },
        relationToSelfSelectOnly: {
          path: 'relationToSelfSelectOnly',
          type: 'relationship',
          hasMany: false,
          relationTo: ['relationship-fields'],
        },
        relationWithAllowCreateToFalse: {
          path: 'relationWithAllowCreateToFalse',
          type: 'relationship',
          hasMany: false,
          relationTo: ['users'],
        },
        relationWithAllowEditToFalse: {
          path: 'relationWithAllowEditToFalse',
          type: 'relationship',
          hasMany: false,
          relationTo: ['users'],
        },
        relationWithDynamicDefault: {
          path: 'relationWithDynamicDefault',
          type: 'relationship',
          hasMany: false,
          relationTo: ['users'],
        },
        relationHasManyWithDynamicDefault: {
          path: 'relationHasManyWithDynamicDefault',
          type: 'relationship',
          hasMany: false,
          relationTo: ['users'],
        },
        relationshipWithMin: {
          path: 'relationshipWithMin',
          type: 'relationship',
          hasMany: true,
          relationTo: ['text-fields'],
        },
        relationshipWithMax: {
          path: 'relationshipWithMax',
          type: 'relationship',
          hasMany: true,
          relationTo: ['text-fields'],
        },
        relationshipHasMany: {
          path: 'relationshipHasMany',
          type: 'relationship',
          hasMany: true,
          relationTo: ['text-fields'],
        },
        array: {
          path: 'array',
          type: 'array',
          fields: {
            relationship: {
              path: 'array.relationship',
              type: 'relationship',
              hasMany: false,
              relationTo: ['text-fields'],
            },
            id: {
              path: 'array.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        relationshipWithMinRows: {
          path: 'relationshipWithMinRows',
          type: 'relationship',
          hasMany: true,
          relationTo: ['text-fields'],
        },
        relationToRow: {
          path: 'relationToRow',
          type: 'relationship',
          hasMany: false,
          relationTo: ['row-fields'],
        },
        relationToRowMany: {
          path: 'relationToRowMany',
          type: 'relationship',
          hasMany: true,
          relationTo: ['row-fields'],
        },
        relationshipDrawer: {
          path: 'relationshipDrawer',
          type: 'relationship',
          hasMany: false,
          relationTo: ['text-fields'],
        },
        relationshipDrawerReadOnly: {
          path: 'relationshipDrawerReadOnly',
          admin: {
            disabled: false,
            hidden: false,
            readOnly: true,
          },
          type: 'relationship',
          hasMany: false,
          relationTo: ['text-fields'],
        },
        polymorphicRelationshipDrawer: {
          path: 'polymorphicRelationshipDrawer',
          type: 'relationship',
          hasMany: false,
          relationTo: ['text-fields', 'array-fields'],
        },
        relationshipDrawerHasMany: {
          path: 'relationshipDrawerHasMany',
          type: 'relationship',
          hasMany: true,
          relationTo: ['text-fields'],
        },
        relationshipDrawerHasManyPolymorphic: {
          path: 'relationshipDrawerHasManyPolymorphic',
          type: 'relationship',
          hasMany: true,
          relationTo: ['text-fields', 'array-fields'],
        },
        relationshipDrawerWithAllowCreateFalse: {
          path: 'relationshipDrawerWithAllowCreateFalse',
          type: 'relationship',
          hasMany: false,
          relationTo: ['text-fields'],
        },
        relationshipDrawerWithFilterOptions: {
          path: 'relationshipDrawerWithFilterOptions',
          type: 'relationship',
          hasMany: false,
          relationTo: ['text-fields'],
        },
        updatedAt: {
          path: 'updatedAt',
          admin: {
            disabled: false,
            hidden: true,
            readOnly: false,
          },
          type: 'date',
        },
        createdAt: {
          path: 'createdAt',
          admin: {
            disabled: false,
            hidden: true,
            readOnly: false,
          },
          type: 'date',
        },
      },
    },
    'text-fields': {
      slug: 'text-fields',
      fields: {
        text: {
          path: 'text',
          required: true,
          type: 'text',
          hasMany: false,
        },
        hiddenTextField: {
          path: 'hiddenTextField',
          hidden: true,
          type: 'text',
          hasMany: false,
        },
        adminHiddenTextField: {
          path: 'adminHiddenTextField',
          admin: {
            disabled: false,
            hidden: true,
            readOnly: false,
          },
          type: 'text',
          hasMany: false,
        },
        disabledTextField: {
          path: 'disabledTextField',
          admin: {
            disabled: true,
            hidden: false,
            readOnly: false,
          },
          type: 'text',
          hasMany: false,
        },
        localizedText: {
          path: 'localizedText',
          type: 'text',
          hasMany: false,
        },
        localizedRequiredText: {
          path: 'localizedRequiredText',
          required: true,
          type: 'text',
          hasMany: false,
        },
        i18nText: {
          path: 'i18nText',
          type: 'text',
          hasMany: false,
        },
        defaultString: {
          path: 'defaultString',
          type: 'text',
          hasMany: false,
        },
        defaultEmptyString: {
          path: 'defaultEmptyString',
          type: 'text',
          hasMany: false,
        },
        defaultFunction: {
          path: 'defaultFunction',
          type: 'text',
          hasMany: false,
        },
        defaultAsync: {
          path: 'defaultAsync',
          type: 'text',
          hasMany: false,
        },
        overrideLength: {
          path: 'overrideLength',
          type: 'text',
          hasMany: false,
        },
        fieldWithDefaultValue: {
          path: 'fieldWithDefaultValue',
          type: 'text',
          hasMany: false,
        },
        dependentOnFieldWithDefaultValue: {
          path: 'dependentOnFieldWithDefaultValue',
          type: 'text',
          hasMany: false,
        },
        hasMany: {
          path: 'hasMany',
          type: 'text',
          hasMany: true,
        },
        hasManySecond: {
          path: 'hasManySecond',
          type: 'text',
          hasMany: true,
        },
        readOnlyHasMany: {
          path: 'readOnlyHasMany',
          admin: {
            disabled: false,
            hidden: false,
            readOnly: true,
          },
          type: 'text',
          hasMany: true,
        },
        validatesHasMany: {
          path: 'validatesHasMany',
          type: 'text',
          hasMany: true,
        },
        localizedHasMany: {
          path: 'localizedHasMany',
          type: 'text',
          hasMany: true,
        },
        withMinRows: {
          path: 'withMinRows',
          type: 'text',
          hasMany: true,
        },
        withMaxRows: {
          path: 'withMaxRows',
          type: 'text',
          hasMany: true,
        },
        defaultValueFromReq: {
          path: 'defaultValueFromReq',
          type: 'text',
          hasMany: false,
        },
        array: {
          path: 'array',
          type: 'array',
          fields: {
            texts: {
              path: 'array.texts',
              type: 'text',
              hasMany: true,
            },
            id: {
              path: 'array.id',
              admin: {
                disabled: false,
                hidden: true,
                readOnly: false,
              },
              type: 'text',
              hasMany: false,
            },
          },
        },
        blocks: {
          path: 'blocks',
          type: 'blocks',
          blocks: {
            blockWithText: {
              slug: 'blockWithText',
              fields: {
                texts: {
                  path: 'blocks.texts',
                  type: 'text',
                  hasMany: true,
                },
                id: {
                  path: 'blocks.id',
                  admin: {
                    disabled: false,
                    hidden: true,
                    readOnly: false,
                  },
                  type: 'text',
                  hasMany: false,
                },
                blockName: {
                  path: 'blocks.blockName',
                  admin: {
                    disabled: true,
                    hidden: false,
                    readOnly: false,
                  },
                  type: 'text',
                  hasMany: false,
                },
              },
              label: 'Block With Text',
            },
          },
        },
        updatedAt: {
          path: 'updatedAt',
          admin: {
            disabled: false,
            hidden: true,
            readOnly: false,
          },
          type: 'date',
        },
        createdAt: {
          path: 'createdAt',
          admin: {
            disabled: false,
            hidden: true,
            readOnly: false,
          },
          type: 'date',
        },
      },
    },
  },
} as const
