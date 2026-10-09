import type { Locator, Page, Response } from '@playwright/test'

import { expect, vi } from 'vitest'

import { adminPageModel } from '../../../fields/admin-page-model.generated.js'
import { test } from '../../int/vitest.js'
import { formatBlockTypeContext } from './errors.js'
import { createPayloadAdmin, formatIndexedLocatorContext, selectors } from './index.js'

const describe = test.suite({})

const createLocator = (): Locator => {
  return {
    click: vi.fn(),
    fill: vi.fn(),
    innerText: vi.fn().mockResolvedValue('current value'),
    inputValue: vi.fn().mockResolvedValue('current value'),
    locator: vi.fn(() => createLocator()),
    nth: vi.fn(() => createLocator()),
    press: vi.fn(),
  } as unknown as Locator
}

describe('Admin page model selectors', () => {
  test('should create selectors for scalar and multi-value text controls', () => {
    expect(selectors.textInput('array.0.texts')).toBe('#field-array__0__texts')
    expect(selectors.textFieldWrapper('array.0.texts')).toBe(
      '.field-type.text:has(#field-array__0__texts)',
    )
    expect(selectors.hasManyTextControl('array.0.texts')).toBe('.field-array__0__texts')
    expect(selectors.hasManyTextInput('array.0.texts')).toBe('.field-array__0__texts input')
  })

  test('should create zero-based list selectors with escaped schema paths', () => {
    expect(selectors.listHeading('group.value')).toBe('#heading-group__value')
    expect(selectors.listCell('group.value', 0)).toBe('.row-1 .cell-group__value')
    expect(selectors.listCell('group.value', 3)).toBe('.row-4 .cell-group__value')
  })

  test('should create direct array and block selectors', () => {
    expect(selectors.arrayRows('content.items')).toBe(
      '#field-content__items > .array-field__draggable-rows > div > .array-field__row',
    )
    expect(selectors.arrayAddRow('content.items')).toBe(
      '#field-content__items > .array-field__add-row',
    )
    expect(selectors.blockRows('content.blocks')).toBe(
      '#field-content__blocks > .blocks-field__rows > div > .blocks-field__row',
    )
    expect(selectors.blockDrawerToggler('content.blocks')).toBe(
      '#field-content__blocks > .blocks-field__drawer-toggler',
    )
    expect(selectors.blockTypePill('quote')).toBe('.blocks-field__block-pill-quote')
    expect(selectors.blockDrawerOption('quote')).toBe(
      '[data-block-slug="quote"] button.thumbnail-card',
    )
  })

  test('should create relationship and document drawer selectors', () => {
    expect(selectors.relationshipAddButton('items.0.author')).toBe(
      '#field-items__0__author .relationship-add-new__add-button',
    )
    expect(selectors.relationshipTarget('text-fields')).toBe(
      '.popup__content .relationship-add-new__relation-button--text-fields',
    )
    expect(selectors.documentDrawer('text-fields')).toBe('[id^=doc-drawer_text-fields_]')
  })
})

describe('formatIndexedLocatorContext', () => {
  test('should report an empty row collection', () => {
    expect(
      formatIndexedLocatorContext({
        availableCount: 0,
        collectionSlug: 'text-fields',
        fieldPath: 'array',
        index: 5,
        itemName: 'row',
        scope: 'document page',
        selector: '#field-array .array-field__row',
      }),
    ).toBe(`Could not resolve row 5 for "array".
Collection: text-fields
Scope: document page
Field path: array
Selector: #field-array .array-field__row
Requested index: 5
Available rows: 0
Valid indexes: none`)
  })

  test('should report the valid range for a non-empty block collection', () => {
    expect(
      formatIndexedLocatorContext({
        availableCount: 5,
        collectionSlug: 'pages',
        fieldPath: 'layout',
        index: 7,
        itemName: 'block',
        scope: 'document drawer',
        selector: '#field-layout .blocks-field__row',
      }),
    ).toContain(`Could not resolve block 7 for "layout".
Collection: pages
Scope: document drawer
Field path: layout
Selector: #field-layout .blocks-field__row
Requested index: 7
Available blocks: 5
Valid indexes: 0-4`)
  })

  test('should report the only valid index when one value exists', () => {
    expect(
      formatIndexedLocatorContext({
        availableCount: 1,
        collectionSlug: 'text-fields',
        fieldPath: 'hasMany',
        index: 1,
        itemName: 'value',
        scope: 'document page',
        selector: '.field-hasMany .multi-value-label__text',
      }),
    ).toContain(`Available values: 1
Valid indexes: 0-0`)
  })

  test('should report the requested block type and location', () => {
    expect(
      formatBlockTypeContext({
        slug: 'quote',
        collectionSlug: 'text-fields',
        fieldPath: 'blocks',
        index: 0,
        scope: 'document drawer',
        selector: '.blocks-field__block-pill-quote',
      }),
    ).toBe(`Could not resolve block type "quote" at index 0 for "blocks".
Collection: text-fields
Scope: document drawer
Field path: blocks
Selector: .blocks-field__block-pill-quote
Requested block type: quote`)
  })
})

describe('createPayloadAdmin', () => {
  test('should provide collection URLs and navigation', async () => {
    const goto = vi.fn().mockResolvedValue(null)
    const page = {
      goto,
      locator: vi.fn().mockReturnValue(createLocator()),
    } as unknown as Page
    const admin = createPayloadAdmin({
      model: adminPageModel,
      page,
      routes: { admin: '/control' },
      serverURL: 'https://example.com',
    })
    const textFields = admin.collection('text-fields')

    expect(textFields.list.url).toBe('https://example.com/control/collections/text-fields')
    expect(textFields.create.url).toBe('https://example.com/control/collections/text-fields/create')
    expect(textFields.document('document-id').url).toBe(
      'https://example.com/control/collections/text-fields/document-id',
    )

    await textFields.create.goto()
    await textFields.list.goto()
    await textFields.document('document-id').goto()

    expect(goto).toHaveBeenNthCalledWith(
      1,
      'https://example.com/control/collections/text-fields/create',
    )
    expect(goto).toHaveBeenNthCalledWith(2, 'https://example.com/control/collections/text-fields')
    expect(goto).toHaveBeenNthCalledWith(
      3,
      'https://example.com/control/collections/text-fields/document-id',
    )
  })

  test('should use generated scalar text selectors and direct locator actions', async () => {
    const fill = vi.fn()
    const inputValue = vi.fn().mockResolvedValue('current value')
    const textInput = {
      ...createLocator(),
      fill,
      inputValue,
    } as unknown as Locator
    const root = {
      goto: vi.fn(),
      locator: vi.fn((selector: string) => {
        if (selector === '#field-text') {
          return textInput
        }

        return createLocator()
      }),
    } as unknown as Page
    const textField = createPayloadAdmin({
      model: adminPageModel,
      page: root,
      serverURL: 'https://example.com',
    }).collection('text-fields').fields.text

    expect(textField.inputID).toBe('field-text')
    expect(textField.selectors).toEqual({
      input: '#field-text',
      wrapper: '.field-type.text:has(#field-text)',
    })

    await textField.fill('next value')
    await expect(textField.getValue()).resolves.toBe('current value')

    expect(fill).toHaveBeenCalledExactlyOnceWith('next value')
    expect(inputValue).toHaveBeenCalledOnce()
  })

  test('should not catch or replace a locator fill error', async () => {
    const playwrightError = new Error('Playwright fill failed')
    const fill = vi.fn().mockRejectedValue(playwrightError)
    const textInput = {
      ...createLocator(),
      fill,
    } as unknown as Locator
    const page = {
      goto: vi.fn(),
      locator: vi.fn((selector: string) => {
        if (selector === '#field-text') {
          return textInput
        }

        return createLocator()
      }),
    } as unknown as Page
    const textField = createPayloadAdmin({
      model: adminPageModel,
      page,
      serverURL: 'https://example.com',
    }).collection('text-fields').fields.text

    await expect(textField.fill('next value')).rejects.toBe(playwrightError)
  })

  test('should observe failed save responses without matching a similar collection slug', async () => {
    let responsePredicate: ((response: Response) => boolean | Promise<boolean>) | undefined
    const saveClickError = new Error('Playwright save click failed')
    const saveButton = {
      ...createLocator(),
      click: vi.fn().mockRejectedValue(saveClickError),
    } as unknown as Locator
    const waitForResponse = vi.fn(
      (predicate: (response: Response) => boolean | Promise<boolean>): Promise<Response> => {
        responsePredicate = predicate
        return new Promise(() => undefined)
      },
    )
    const page = {
      goto: vi.fn(),
      locator: vi.fn((selector: string) => {
        return selector === '#action-save' ? saveButton : createLocator()
      }),
      waitForResponse,
    } as unknown as Page
    const textFields = createPayloadAdmin({
      model: adminPageModel,
      page,
      serverURL: 'https://example.com',
    }).collection('text-fields')
    const response = (method: string, pathname: string, ok: boolean) =>
      ({
        ok: () => ok,
        request: () => ({ method: () => method }),
        url: () => `https://example.com${pathname}`,
      }) as Response

    await expect(textFields.save()).rejects.toBe(saveClickError)
    expect(responsePredicate).toBeTypeOf('function')
    expect(await responsePredicate?.(response('POST', '/api/text-fields', false))).toBe(true)
    expect(await responsePredicate?.(response('PATCH', '/api/text-fields/123', false))).toBe(true)
    expect(await responsePredicate?.(response('POST', '/api/text-fields-other', true))).toBe(false)
    expect(await responsePredicate?.(response('GET', '/api/text-fields', true))).toBe(false)
  })

  test('should observe save responses on a configured API route', async () => {
    let responsePredicate: ((response: Response) => boolean | Promise<boolean>) | undefined
    const saveClickError = new Error('Playwright save click failed')
    const saveButton = {
      ...createLocator(),
      click: vi.fn().mockRejectedValue(saveClickError),
    } as unknown as Locator
    const waitForResponse = vi.fn(
      (predicate: (response: Response) => boolean | Promise<boolean>): Promise<Response> => {
        responsePredicate = predicate
        return new Promise(() => undefined)
      },
    )
    const page = {
      goto: vi.fn(),
      locator: vi.fn((selector: string) => {
        return selector === '#action-save' ? saveButton : createLocator()
      }),
      waitForResponse,
    } as unknown as Page
    const textFields = createPayloadAdmin({
      model: adminPageModel,
      page,
      routes: { api: '/custom-api' },
      serverURL: 'https://example.com',
    }).collection('text-fields')
    const response = (pathname: string) =>
      ({
        request: () => ({ method: () => 'POST' }),
        url: () => `https://example.com${pathname}`,
      }) as Response

    await expect(textFields.save()).rejects.toBe(saveClickError)
    expect(responsePredicate).toBeTypeOf('function')
    expect(await responsePredicate?.(response('/custom-api/text-fields'))).toBe(true)
    expect(await responsePredicate?.(response('/api/text-fields'))).toBe(false)
  })
})
