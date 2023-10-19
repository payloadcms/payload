import { render } from '@testing-library/react'
import React from 'react'

import type { BlockField, DateField, SelectField } from '../../../../../../fields/config/types'

import BlocksCell from './field-types/Blocks'
import Checkbox from './field-types/Checkbox'
import DateCell from './field-types/Date'
import Select from './field-types/Select'
import Textarea from './field-types/Textarea'

jest.mock('../../../../utilities/Config', () => ({
  useConfig: () => ({ admin: { dateFormat: 'MMMM do yyyy, h:mm a' } }),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (string) => string }),
}))

describe('Cell Types', () => {
  describe('Blocks', () => {
    const field: BlockField = {
      blocks: [
        {
          fields: [],
          labels: {
            plural: 'Numbers',
            singular: 'Number',
          },
          slug: 'number',
        },
      ],
      label: 'Blocks Content',
      labels: {
        plural: 'Blocks Content',
        singular: 'Block',
      },
      name: 'blocks',
      type: 'blocks',
    }

    it('renders multiple', () => {
      const data = [{ blockType: 'number' }, { blockType: 'number' }]
      const { container } = render(<BlocksCell data={data} field={field} />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('2 Blocks Content - Number, Number')
    })

    it('renders zero', () => {
      const data = []
      const { container } = render(<BlocksCell data={data} field={field} />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('0 Blocks Content')
    })

    it('renders "and X more" if over maximum of 5', () => {
      const data = [
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
      ]

      const { container } = render(<BlocksCell data={data} field={field} />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('fields:itemsAndMore')
    })
  })

  describe('Date', () => {
    const field: DateField = {
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
      name: 'dayOnly',
      type: 'date',
    }

    it('renders date', () => {
      const timeStamp = '2020-10-06T14:07:39.033Z'
      const { container } = render(<DateCell data={timeStamp} field={field} />)
      const dateMatch = /October\s[6|7]th\s2020,\s\d{1,2}:[0|3]7\s[A|P]M/ // Had to account for timezones in CI
      const el = container.querySelector('span')
      expect(el.textContent).toMatch(dateMatch)
    })

    it('handles undefined', () => {
      const timeStamp = undefined
      const { container } = render(<DateCell data={timeStamp} field={field} />)
      const el = container.querySelector('span')
      expect(el.textContent).toBe('')
    })
  })

  describe('Checkbox', () => {
    it('renders true', () => {
      const { container } = render(<Checkbox data />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('true')
    })
    it('renders false', () => {
      const { container } = render(<Checkbox data={false} />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('false')
    })
  })

  describe('Textarea', () => {
    it('renders data', () => {
      const { container } = render(<Textarea data="data" />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('data')
    })
    it('handle undefined - bug/13', () => {
      const { container } = render(<Textarea data={undefined} />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('')
    })
  })
  describe('Select', () => {
    const fieldWithOptionsObject: SelectField = {
      name: 'selectObject',
      options: [
        {
          label: 'One',
          value: 'one',
        },
        {
          label: 'Two',
          value: 'two',
        },
      ],
      type: 'select',
    }
    const fieldWithStringsOptions: SelectField = {
      name: 'selectString',
      options: ['blue', 'green', 'yellow'],
      type: 'select',
    }
    it('renders options objects', () => {
      const { container } = render(<Select data="one" field={fieldWithOptionsObject} />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('One')
    })
    it('renders option strings', () => {
      const { container } = render(<Select data="blue" field={fieldWithStringsOptions} />)
      const el = container.querySelector('span')
      expect(el).toHaveTextContent('blue')
    })

    describe('HasMany', () => {
      it('renders options objects', () => {
        const { container } = render(
          <Select data={['one', 'two']} field={fieldWithOptionsObject} />,
        )
        const el = container.querySelector('span')
        expect(el).toHaveTextContent('One, Two')
      })
      it('renders option strings', () => {
        const { container } = render(
          <Select data={['blue', 'green']} field={fieldWithStringsOptions} />,
        )
        const el = container.querySelector('span')
        expect(el).toHaveTextContent('blue, green')
      })
    })
  })
})
