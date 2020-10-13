/* eslint-disable react/jsx-max-props-per-line */
import React from 'react';
import { render } from '@testing-library/react';
import BlocksCell from './types/Blocks';
import DateCell from './types/Date';
import Checkbox from './types/Checkbox';

describe('Cell Types', () => {
  describe('Blocks', () => {
    const field = {
      label: 'Blocks Content',
      name: 'blocks',
      labels: {
        singular: 'Block',
      },
      type: 'blocks',
      blocks: [
        {
          slug: 'number',
          labels: {
            singular: 'Number',
          },
        },
      ],
    };

    it('renders multiple', () => {
      const data = [
        { blockType: 'number' },
        { blockType: 'number' },
      ];
      const { container } = render(<BlocksCell data={data} field={field} />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('2 Blocks Content - Number, Number');
    });

    it('renders zero', () => {
      const data = [];
      const { container } = render(<BlocksCell data={data} field={field} />);
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

      const { container } = render(<BlocksCell data={data} field={field} />);
      const el = container.querySelector('span');
      expect(el).toHaveTextContent('6 Blocks Content - Number, Number, Number, Number, Number and 1 more');
    });
  });


  describe('Date', () => {
    it('renders date', () => {
      const timeStamp = '2020-10-06T14:07:39.033Z';
      const { container } = render(<DateCell data={timeStamp} />);
      const dateMatch = /October\s6th\s2020,\s[\d]{1,2}:07\s[A|P]M/; // Had to account for timezones in CI
      const el = container.querySelector('span');
      expect(el.textContent).toMatch(dateMatch);
    });

    it('handles undefined', () => {
      const timeStamp = undefined;
      const { container } = render(<DateCell data={timeStamp} />);
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
});
