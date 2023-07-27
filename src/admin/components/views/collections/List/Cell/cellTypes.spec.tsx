import React from 'react';
import { render } from '@testing-library/react';
import { BlockField, DateField, SelectField } from '../../../../../../fields/config/types';
import BlocksCell from './field-types/Blocks';
import DateCell from './field-types/Date';
import Checkbox from './field-types/Checkbox';
import Textarea from './field-types/Textarea';
import Select from './field-types/Select';
import { jest } from '@jest/globals';

// unstable_mockModule is required for esm. See https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
jest.unstable_mockModule('../../../../utilities/Config', () => ({
  useConfig: () => ({ admin: { dateFormat: 'MMMM do yyyy, h:mm a' } }),
}));

jest.unstable_mockModule('react-i18next', () => ({
  useTranslation: () => ({ t: (string) => string }),
}));

describe('Cell Types', () => {
  describe('Blocks', () => {
    const field: BlockField = {
      label: 'Blocks Content',
      name: 'blocks',
      labels: {
        singular: 'Block',
        plural: 'Blocks Content',
      },
      type: 'blocks',
      blocks: [
        {
          slug: 'number',
          labels: {
            plural: 'Numbers',
            singular: 'Number',
          },
          fields: [],
        },
      ],
    };

    it('renders multiple', () => {
      const data = [
        { blockType: 'number' },
        { blockType: 'number' },
      ];
      const { container } = render(<BlocksCell
        data={data}
        field={field}
      />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('2 Blocks Content - Number, Number');
    });

    it('renders zero', () => {
      const data = [];
      const { container } = render(<BlocksCell
        data={data}
        field={field}
      />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('0 Blocks Content');
    });

    it('renders "and X more" if over maximum of 5', () => {
      const data = [
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
        { blockType: 'number' },
      ];

      const { container } = render(<BlocksCell
        data={data}
        field={field}
      />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('fields:itemsAndMore');
    });
  });


  describe('Date', () => {
    const field: DateField = {
      name: 'dayOnly',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    };

    it('renders date', () => {
      const timeStamp = '2020-10-06T14:07:39.033Z';
      const { container } = render(<DateCell
        data={timeStamp}
        field={field}
      />);
      
      const date = new Date(timeStamp);
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = `${date.getDate()}th`;
      
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      };      
      
      const datePart = `${month} ${day} ${year},`;
      const timePart = date.toLocaleString('en-US', timeOptions);      

      const dateMatch = `${datePart} ${timePart}`.replace(/\s/g," ");
      const el = container.querySelector('span');
      expect(el.textContent.replace(/\s/g," ")).toEqual(dateMatch);
    });

    it('handles undefined', () => {
      const timeStamp = undefined;
      const { container } = render(<DateCell
        data={timeStamp}
        field={field}
      />);
      const el = container.querySelector('span');
      expect(el.textContent).toBe('');
    });
  });

  describe('Checkbox', () => {
    it('renders true', () => {
      const { container } = render(<Checkbox data />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('true');
    });
    it('renders false', () => {
      const { container } = render(<Checkbox data={false} />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('false');
    });
  });

  describe('Textarea', () => {
    it('renders data', () => {
      const { container } = render(<Textarea data="data" />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('data');
    });
    it('handle undefined - bug/13', () => {
      const { container } = render(<Textarea data={undefined} />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('');
    });
  });
  describe('Select', () => {
    const fieldWithOptionsObject: SelectField = {
      type: 'select',
      name: 'selectObject',
      options: [{
        value: 'one',
        label: 'One',
      }, {
        value: 'two',
        label: 'Two',
      }],
    };
    const fieldWithStringsOptions: SelectField = {
      type: 'select',
      name: 'selectString',
      options: ['blue', 'green', 'yellow'],
    };
    it('renders options objects', () => {
      const { container } = render(<Select
        data="one"
        field={fieldWithOptionsObject}
      />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('One');
    });
    it('renders option strings', () => {
      const { container } = render(<Select
        data="blue"
        field={fieldWithStringsOptions}
      />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('blue');
    });

    describe('HasMany', () => {
      it('renders options objects', () => {
        const { container } = render(<Select
          data={['one', 'two']}
          field={fieldWithOptionsObject}
        />);
        const el = container.querySelector('span');
        expect(el).toHaveTextContent('One, Two');
      });
      it('renders option strings', () => {
        const { container } = render(<Select
          data={['blue', 'green']}
          field={fieldWithStringsOptions}
        />);
        const el = container.querySelector('span');
        expect(el).toHaveTextContent('blue, green');
      });
    });
  });
});
