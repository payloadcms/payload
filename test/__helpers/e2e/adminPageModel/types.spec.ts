import type { Locator } from '@playwright/test'

import { describe, expect, test } from 'tstyche'

import type { adminPageModel } from '../../../fields/admin-page-model.generated.js'
import type {
  ArrayRowModel,
  BlockRowModel,
  HasManyTextFieldModel,
  HasManyTextValueModel,
  PayloadAdmin,
  PayloadCollection,
  TextFieldModel,
} from './index.js'

type FieldsAdminPageModel = typeof adminPageModel

declare const admin: PayloadAdmin<FieldsAdminPageModel>

describe('PayloadAdmin', () => {
  test('limits collections and fields to the generated descriptor', () => {
    const textFields = admin.collection('text-fields')

    expect(textFields).type.toBe<PayloadCollection<FieldsAdminPageModel, 'text-fields'>>()
    expect(textFields.fields.text).type.toBe<TextFieldModel>()
    expect(textFields.fields.hasMany).type.toBe<HasManyTextFieldModel>()
    expect(textFields.fields).type.not.toHaveProperty('disableListColumnText')
    expect(admin.collection).type.not.toBeCallableWith('missing-collection')
  })

  test('provides raw selectors and high-level scalar text actions', () => {
    const field = admin.collection('text-fields').fields.text

    expect(field.wrapper).type.toBe<Locator>()
    expect(field.input).type.toBe<Locator>()
    expect(field.inputID).type.toBe<string>()
    expect(field.selectors.wrapper).type.toBe<string>()
    expect(field.selectors.input).type.toBe<string>()
    expect(field.fill).type.toBeCallableWith('value')
    expect(field.getValue()).type.toBe<Promise<string>>()
    expect(field.expectValue).type.toBeCallableWith('value')
    expect(field.heading).type.toBe<Locator>()
    expect(field.cell(0)).type.toBe<Locator>()
  })

  test('provides multi-value text actions without claiming a stable input ID', () => {
    const field = admin.collection('text-fields').fields.hasMany

    expect(field).type.not.toHaveProperty('inputID')
    expect(field.addValue).type.toBeCallableWith('first')
    expect(field.expectValues).type.toBeCallableWith(['first', 'second'])
    expect(field.value(0)).type.toBe<Promise<HasManyTextValueModel>>()
  })

  test('narrows nested array and block fields', async () => {
    const textFields = admin.collection('text-fields')
    const arrayRow = await textFields.fields.array.row(0)
    const addedArrayRow = await textFields.fields.array.addRow()
    const blockRow = await textFields.fields.blocks.block(0, 'blockWithText')
    const addedBlockRow = await textFields.fields.blocks.addBlock('blockWithText')

    expect(arrayRow).type.toBe<
      ArrayRowModel<
        FieldsAdminPageModel['collections']['text-fields']['fields']['array']['fields'],
        FieldsAdminPageModel
      >
    >()
    expect(addedArrayRow.fields.texts).type.toBe<HasManyTextFieldModel>()
    expect(blockRow).type.toBe<
      BlockRowModel<
        FieldsAdminPageModel['collections']['text-fields']['fields']['blocks']['blocks']['blockWithText'],
        FieldsAdminPageModel
      >
    >()
    expect(addedBlockRow.fields.texts).type.toBe<HasManyTextFieldModel>()
    expect(textFields.fields.blocks.block).type.not.toBeCallableWith(0, 'missing-block')
    expect(textFields.fields.blocks.addBlock).type.not.toBeCallableWith('missing-block')
  })

  test('narrows relationship drawer targets', () => {
    const relationships = admin.collection('relationship-fields')

    expect(relationships.fields.relationship.createInDrawer('text-fields')).type.toBe<
      Promise<PayloadCollection<FieldsAdminPageModel, 'text-fields'>>
    >()
    expect(relationships.fields.relationship.createInDrawer('array-fields')).type.toBe<
      Promise<PayloadCollection<FieldsAdminPageModel, 'array-fields'>>
    >()
    expect(relationships.fields.relationship.createInDrawer).type.not.toBeCallableWith('users')
    expect(relationships.fields.relationship.createInDrawer).type.not.toBeCallableWith()

    expect(relationships.fields.relationshipDrawer.createInDrawer()).type.toBe<
      Promise<PayloadCollection<FieldsAdminPageModel, 'text-fields'>>
    >()
    expect(relationships.fields.relationshipDrawer.createInDrawer).type.not.toBeCallableWith(
      'array-fields',
    )
  })

  test('preserves the generated model for relationships nested in arrays', async () => {
    const relationships = admin.collection('relationship-fields')
    const arrayRow = await relationships.fields.array.row(0)

    expect(arrayRow.fields.relationship.createInDrawer()).type.toBe<
      Promise<PayloadCollection<FieldsAdminPageModel, 'text-fields'>>
    >()
  })
})
