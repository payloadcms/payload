import type { SelectField, ValidateOptions } from './config/types.js'

import {
  blocks,
  number,
  password,
  point,
  relationship,
  select,
  text,
  textarea,
  type BlocksFieldValidation,
  type PointFieldValidation,
  type SelectFieldValidation,
} from './validations.js'
import { describe, expect, it, vitest } from 'vitest'

const t = vitest.fn((string) => string)

let options: ValidateOptions<any, any, any, any> = {
  data: undefined,
  operation: 'create',
  req: {
    context: {},
    payload: {
      config: {
        db: {
          defaultIDType: 'text',
          init: () => null,
        },
      },
    },
    t,
  },
  siblingData: undefined,
}

describe('Field Validations', () => {
  describe('text', () => {
    it('should validate', () => {
      const val = 'test'
      const result = text(val, options)
      expect(result).toBe(true)
    })
    it('should show required message', () => {
      const val = undefined
      const result = text(val, { ...options, required: true })
      expect(result).toBe('validation:required')
    })
    it('should handle undefined', () => {
      const val = undefined
      const result = text(val, options)
      expect(result).toBe(true)
    })
    it('should validate maxLength', () => {
      const val = 'toolong'
      const result = text(val, { ...options, maxLength: 5 })
      expect(result).toBe('validation:shorterThanMax')
    })
    it('should validate minLength', () => {
      const val = 'short'
      const result = text(val, { ...options, minLength: 10 })
      expect(result).toBe('validation:longerThanMin')
    })
    it('should validate maxLength with no value', () => {
      const val = undefined
      const result = text(val, { ...options, maxLength: 5 })
      expect(result).toBe(true)
    })
    it('should validate minLength with no value', () => {
      const val = undefined
      const result = text(val, { ...options, minLength: 10 })
      expect(result).toBe(true)
    })
    it('should validate minLength with empty string', () => {
      const val = ''
      const result = text(val, { ...options, required: false, minLength: 1 })
      expect(result).toBe('validation:longerThanMin')
    })
    it('should validate an array of texts', async () => {
      const val = ['test']
      const result = text(val, { ...options, hasMany: true })
      expect(result).toBe(true)
    })
    it('should handle required array of texts', async () => {
      const val = ['test']
      const result = text(val, { ...options, hasMany: true, required: true })
      expect(result).toBe(true)
    })
  })

  describe('textarea', () => {
    options = { ...options, field: { name: 'test', type: 'textarea' } }
    it('should validate', () => {
      const val = 'test'
      const result = textarea(val, options)
      expect(result).toBe(true)
    })
    it('should show required message', () => {
      const val = undefined
      const result = textarea(val, { ...options, required: true })
      expect(result).toBe('validation:required')
    })

    it('should handle undefined', () => {
      const val = undefined
      const result = textarea(val, options)
      expect(result).toBe(true)
    })
    it('should validate maxLength', () => {
      const val = 'toolong'
      const result = textarea(val, { ...options, maxLength: 5 })
      expect(result).toBe('validation:shorterThanMax')
    })

    it('should validate minLength', () => {
      const val = 'short'
      const result = textarea(val, { ...options, minLength: 10 })
      expect(result).toBe('validation:longerThanMin')
    })
    it('should validate maxLength with no value', () => {
      const val = undefined
      const result = textarea(val, { ...options, maxLength: 5 })
      expect(result).toBe(true)
    })
    it('should validate minLength with no value', () => {
      const val = undefined
      const result = textarea(val, { ...options, minLength: 10 })
      expect(result).toBe(true)
    })
  })

  describe('password', () => {
    const passwordOptions = {
      ...options,
      name: 'test',
      type: 'password',
    }
    it('should validate', () => {
      const val = 'test'
      const result = password(val, passwordOptions)
      expect(result).toBe(true)
    })
    it('should show required message', () => {
      const val = undefined
      const result = password(val, { ...passwordOptions, required: true })
      expect(result).toBe('validation:required')
    })
    it('should handle undefined', () => {
      const val = undefined
      const result = password(val, passwordOptions)
      expect(result).toBe(true)
    })
    it('should validate maxLength', () => {
      const val = 'toolong'
      const result = password(val, { ...passwordOptions, maxLength: 5 })
      expect(result).toBe('validation:shorterThanMax')
    })
    it('should validate minLength', () => {
      const val = 'short'
      const result = password(val, { ...passwordOptions, minLength: 10 })
      expect(result).toBe('validation:longerThanMin')
    })
    it('should validate maxLength with no value', () => {
      const val = undefined
      const result = password(val, { ...passwordOptions, maxLength: 5 })
      expect(result).toBe(true)
    })
    it('should validate minLength with no value', () => {
      const val = undefined
      const result = password(val, { ...passwordOptions, minLength: 10 })
      expect(result).toBe(true)
    })
  })

  describe('point', () => {
    const pointOptions: Parameters<PointFieldValidation>[1] = {
      ...options,
      name: 'point',
      type: 'point',
    }
    type PointFieldValue = [number | string, number | string]
    it('should validate numbers', () => {
      const val: PointFieldValue = ['0.1', '0.2']
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should validate strings that could be numbers', () => {
      const val: PointFieldValue = ['0.1', '0.2']
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should show required message when undefined', () => {
      const val = undefined
      const result = point(val, { ...pointOptions, required: true })
      expect(result).not.toBe(true)
    })
    it('should show required message when array', () => {
      const val = []
      const result = point(val, { ...pointOptions, required: true })
      expect(result).not.toBe(true)
    })
    it('should show required message when array of undefined', () => {
      const val = [undefined, undefined]
      const result = point(val, { ...pointOptions, required: true })
      expect(result).not.toBe(true)
    })
    it('should handle undefined not required', () => {
      const val = undefined
      const result = password(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should handle empty array not required', () => {
      const val = []
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should handle array of undefined not required', () => {
      const val = [undefined, undefined]
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should prevent text input', () => {
      const val = ['bad', 'input']
      const result = point(val, pointOptions)
      expect(result).not.toBe(true)
    })
    it('should prevent missing value', () => {
      const val = [0.1]
      const result = point(val, pointOptions)
      expect(result).not.toBe(true)
    })
    it('should validate longitude within bounds', () => {
      const val: PointFieldValue = ['180', '0']
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should validate longitude at lower bound', () => {
      const val: PointFieldValue = ['-180', '0']
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should prevent longitude below lower bound', () => {
      const val: PointFieldValue = ['-181', '0']
      const result = point(val, pointOptions)
      expect(result).toBe('validation:longitudeOutOfBounds')
    })
    it('should prevent longitude above upper bound', () => {
      const val: PointFieldValue = ['181', '0']
      const result = point(val, pointOptions)
      expect(result).toBe('validation:longitudeOutOfBounds')
    })
    it('should validate latitude within bounds', () => {
      const val: PointFieldValue = ['0', '90']
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should validate latitude at lower bound', () => {
      const val: PointFieldValue = ['0', '-90']
      const result = point(val, pointOptions)
      expect(result).toBe(true)
    })
    it('should prevent latitude below lower bound', () => {
      const val: PointFieldValue = ['0', '-91']
      const result = point(val, pointOptions)
      expect(result).toBe('validation:latitudeOutOfBounds')
    })
    it('should prevent latitude above upper bound', () => {
      const val: PointFieldValue = ['0', '91']
      const result = point(val, pointOptions)
      expect(result).toBe('validation:latitudeOutOfBounds')
    })
  })

  describe('relationship', () => {
    const relationCollection = {
      slug: 'relation',
      fields: [
        {
          name: 'id',
          type: 'text',
        },
      ],
    }

    const relationshipOptions = {
      ...options,
      relationTo: 'relation',
      req: {
        ...options.req,
        payload: {
          ...options.req.payload,
          collections: {
            relation: {
              config: relationCollection,
            },
          },
          config: {
            collections: [relationCollection],
          },
        },
      },
    }
    it('should handle required', async () => {
      const val = undefined
      const result = await relationship(val, { ...relationshipOptions, required: true })
      expect(result).not.toBe(true)
    })
    it('should handle required with hasMany', async () => {
      const val = []
      const result = await relationship(val, {
        ...relationshipOptions,
        hasMany: true,
        required: true,
      })
      expect(result).not.toBe(true)
    })
    it('should enforce hasMany min', async () => {
      const minOptions = {
        ...relationshipOptions,
        hasMany: true,
        minRows: 2,
      }

      const val = ['a']

      const result = await relationship(val, minOptions)
      expect(result).not.toBe(true)

      const allowed = await relationship(['a', 'b'], minOptions)
      expect(allowed).toStrictEqual(true)
    })
    it('should enforce hasMany max', async () => {
      const maxOptions = {
        ...relationshipOptions,
        hasMany: true,
        maxRows: 2,
      }
      let val = ['a', 'b', 'c']

      const result = await relationship(val, maxOptions)
      expect(result).not.toBe(true)

      val = ['a']
      const allowed = await relationship(val, maxOptions)
      expect(allowed).toStrictEqual(true)
    })
  })

  describe('select', () => {
    const selectOptions: Parameters<SelectFieldValidation>[1] = {
      ...options,
      type: 'select',
      options: ['one', 'two', 'three'],
    }
    const optionsRequired: Parameters<SelectFieldValidation>[1] = {
      ...selectOptions,
      options: [
        {
          label: 'One',
          value: 'one',
        },
        {
          label: 'two',
          value: 'two',
        },
        {
          label: 'three',
          value: 'three',
        },
      ],
      required: true,
    }
    const optionsWithEmptyString: Parameters<SelectFieldValidation>[1] = {
      ...selectOptions,
      options: [
        {
          label: 'None',
          value: '',
        },
        {
          label: 'Option',
          value: 'option',
        },
      ],
    }
    it('should allow valid input', async () => {
      const val = 'one'
      const result = select(val, selectOptions)
      expect(result).toStrictEqual(true)
    })
    it('should prevent invalid input', () => {
      const val = 'bad'
      const result = select(val, selectOptions)
      expect(result).not.toStrictEqual(true)
    })
    it('should allow null input', () => {
      const val = null
      const result = select(val, selectOptions)
      expect(result).toStrictEqual(true)
    })
    it('should allow undefined input', () => {
      let val
      const result = select(val, selectOptions)
      expect(result).toStrictEqual(true)
    })
    it('should prevent empty string input', () => {
      const val = ''
      const result = select(val, selectOptions)
      expect(result).not.toStrictEqual(true)
    })
    it('should prevent undefined input with required', () => {
      let val
      const result = select(val, optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
    it('should prevent empty string input with required', () => {
      const result = select('', optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
    it('should prevent undefined input with required and hasMany', () => {
      let val
      options.hasMany = true
      const result = select(val, optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
    it('should prevent empty array input with required and hasMany', () => {
      optionsRequired.hasMany = true
      const result = select([], optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
    it('should prevent empty string array input with required and hasMany', () => {
      options.hasMany = true
      const result = select([''], optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
    it('should prevent null input with required and hasMany', () => {
      const val = null
      options.hasMany = true
      const result = select(val, optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
    it('should allow valid input with option objects', () => {
      const val = 'one'
      options.hasMany = false
      const result = select(val, optionsRequired)
      expect(result).toStrictEqual(true)
    })
    it('should prevent invalid input with option objects', () => {
      const val = 'bad'
      options.hasMany = false
      const result = select(val, optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
    it('should allow empty string input with option object', () => {
      const val = ''
      const result = select(val, optionsWithEmptyString)
      expect(result).toStrictEqual(true)
    })
    it('should allow empty string input with option object and required', () => {
      const val = ''
      optionsWithEmptyString.required = true
      const result = select(val, optionsWithEmptyString)
      expect(result).toStrictEqual(true)
    })
    it('should allow valid input with hasMany', () => {
      const val = ['one', 'two']
      const result = select(val, selectOptions)
      expect(result).toStrictEqual(true)
    })
    it('should prevent invalid input with hasMany', () => {
      const val = ['one', 'bad']
      const result = select(val, selectOptions)
      expect(result).not.toStrictEqual(true)
    })
    it('should allow valid input with hasMany option objects', () => {
      const val = ['one', 'three']
      optionsRequired.hasMany = true
      const result = select(val, optionsRequired)
      expect(result).toStrictEqual(true)
    })
    it('should prevent invalid input with hasMany option objects', () => {
      const val = ['three', 'bad']
      optionsRequired.hasMany = true
      const result = select(val, optionsRequired)
      expect(result).not.toStrictEqual(true)
    })
  })

  describe('blocks', () => {
    const blocksOptions: Parameters<BlocksFieldValidation>[1] = {
      ...options,
    }
    it('basic blocks should pass validation', async () => {
      const val: any[] = [
        {
          blockType: 'block1',
          someField: 'some data',
        },
        {
          blockType: 'block2',
          someField: 'some data',
        },
      ]
      const result = await blocks(val, blocksOptions)
      expect(result).toStrictEqual(true)
    })

    it('should respect required validation', async () => {
      const result1 = await blocks(
        [
          {
            blockType: 'block1',
            someField: 'some data',
          },
        ],
        { ...blocksOptions, required: true },
      )
      expect(result1).toStrictEqual(true)

      const result2 = await blocks([], { ...blocksOptions, required: true })
      expect(result2).not.toStrictEqual(true)

      const result3 = await blocks(undefined, { ...blocksOptions, required: true })
      expect(result3).not.toStrictEqual(true)

      const result4 = await blocks(null, { ...blocksOptions, required: true })
      expect(result4).not.toStrictEqual(true)
    })

    it('should respect minRows validation', async () => {
      const val: any[] = [
        {
          blockType: 'block1',
          someField: 'some data',
        },
        {
          blockType: 'block2',
          someField: 'some data',
        },
      ]
      const result1 = await blocks(val, { ...blocksOptions, minRows: 0 })
      expect(result1).toStrictEqual(true)
      const result2 = await blocks(val, { ...blocksOptions, minRows: 2 })
      expect(result2).toStrictEqual(true)

      const result3 = await blocks(val, { ...blocksOptions, minRows: 3 })
      expect(result3).not.toStrictEqual(true)
    })

    it('should respect maxRows validation', async () => {
      const val: any[] = [
        {
          blockType: 'block1',
          someField: 'some data',
        },
        {
          blockType: 'block2',
          someField: 'some data',
        },
      ]

      const result1 = await blocks(val, { ...blocksOptions, maxRows: 2 })
      expect(result1).toStrictEqual(true)
      const result2 = await blocks(val, { ...blocksOptions, maxRows: 3 })
      expect(result2).toStrictEqual(true)

      const result3 = await blocks(val, { ...blocksOptions, maxRows: 1 })
      expect(result3).not.toStrictEqual(true)
    })

    it('should respect both minRows and maxRows validation', async () => {
      const val: any[] = [
        {
          blockType: 'block1',
          someField: 'some data',
        },
        {
          blockType: 'block2',
          someField: 'some data',
        },
      ]
      const result1 = await blocks(val, { ...blocksOptions, maxRows: 2, minRows: 2 })
      expect(result1).toStrictEqual(true)

      const result2 = await blocks(val, { ...blocksOptions, maxRows: 1, minRows: 4 })
      expect(result2).not.toStrictEqual(true)

      const result3 = await blocks(val, { ...blocksOptions, maxRows: 1, minRows: 0 })
      expect(result3).not.toStrictEqual(true)

      const result4 = await blocks(val, { ...blocksOptions, maxRows: 5, minRows: 3 })
      expect(result4).not.toStrictEqual(true)
    })

    it('should validate static filterOptions', async () => {
      const val: any[] = [
        {
          blockType: 'block1',
          someField: 'some data',
        },
        {
          blockType: 'block2',
          someField: 'some data',
        },
      ]
      const result1 = await blocks(val, { ...blocksOptions, filterOptions: ['block1', 'block2'] })
      expect(result1).toStrictEqual(true)

      const result2 = await blocks(val, {
        ...blocksOptions,
        filterOptions: ['block1', 'block2', 'block3'],
      })
      expect(result2).toStrictEqual(true)

      const result3 = await blocks(val, { ...blocksOptions, filterOptions: ['block1', 'block3'] })
      expect(result3).not.toStrictEqual(true)

      const result4 = await blocks(val, { ...blocksOptions, filterOptions: [] })
      expect(result4).not.toStrictEqual(true)
    })

    it('should validate dynamic filterOptions 1', async () => {
      const val: any[] = [
        {
          blockType: 'block1',
          someField: 'some data',
        },
        {
          blockType: 'block2',
          someField: 'some data',
        },
      ]
      const result1 = await blocks(val, { ...blocksOptions, filterOptions: () => true })
      expect(result1).toStrictEqual(true)

      const result2 = await blocks(val, {
        ...blocksOptions,
        filterOptions: () => ['block1', 'block2'],
      })
      expect(result2).toStrictEqual(true)

      const result3 = await blocks(val, {
        ...blocksOptions,
        filterOptions: () => ['block1', 'block2', 'block3'],
      })
      expect(result3).toStrictEqual(true)

      const result4 = await blocks(val, { ...blocksOptions, filterOptions: () => [] })
      expect(result4).not.toStrictEqual(true)

      const result5 = await blocks(val, { ...blocksOptions, filterOptions: () => ['block1'] })
      expect(result5).not.toStrictEqual(true)

      const result6 = await blocks(val, {
        ...blocksOptions,
        filterOptions: () => ['block1', 'block3'],
      })
      expect(result6).not.toStrictEqual(true)
    })
  })

  describe('number', () => {
    const numberOptions = {
      ...options,
      name: 'test',
      type: 'number',
    }
    it('should validate', () => {
      const val = 1
      const result = number(val, numberOptions)
      expect(result).toBe(true)
    })
    it('should validate 0', () => {
      const val = 0
      const result = number(val, { ...numberOptions, required: true })
      expect(result).toBe(true)
    })
    it('should validate 2', () => {
      const val = 1.5
      const result = number(val, numberOptions)
      expect(result).toBe(true)
    })
    it('should show invalid number message', () => {
      const val = 'test'
      const result = number(val, { ...numberOptions })
      expect(result).toBe('validation:enterNumber')
    })
    it('should handle empty value', () => {
      const val = ''
      const result = number(val, { ...numberOptions })
      expect(result).toBe(true)
    })
    it('should handle required value', () => {
      const val = ''
      const result = number(val, { ...numberOptions, required: true })
      expect(result).toBe('validation:required')
    })
    it('should validate minValue', () => {
      const val = 2.4
      const result = number(val, { ...numberOptions, min: 2.5 })
      expect(result).toBe('validation:lessThanMin')
    })
    it('should validate maxValue', () => {
      const val = 1.25
      const result = number(val, { ...numberOptions, max: 1 })
      expect(result).toBe('validation:greaterThanMax')
    })
    it('should validate an array of numbers', async () => {
      const val = [1.25, 2.5]
      const result = number(val, { ...numberOptions, hasMany: true })
      expect(result).toBe(true)
    })
    it('should validate an array of numbers using min', async () => {
      const val = [1.25, 2.5]
      const result = number(val, { ...numberOptions, hasMany: true, min: 3 })
      expect(result).toBe('validation:lessThanMin')
    })
    it('should validate an array of numbers using max', async () => {
      const val = [1.25, 2.5]
      const result = number(val, { ...numberOptions, hasMany: true, max: 1 })
      expect(result).toBe('validation:greaterThanMax')
    })
    it('should validate an array of numbers using minRows', async () => {
      const val = [1.25, 2.5]
      const result = number(val, { ...numberOptions, hasMany: true, minRows: 4 })
      expect(result).toBe('validation:requiresAtLeast')
    })
    it('should validate an array of numbers using maxRows', async () => {
      const val = [1.25, 2.5, 3.5]
      const result = number(val, { ...numberOptions, hasMany: true, maxRows: 2 })
      expect(result).toBe('validation:requiresNoMoreThan')
    })
  })
})
