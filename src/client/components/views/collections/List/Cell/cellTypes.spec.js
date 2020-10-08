import React from 'react';
import { render } from '@testing-library/react';
import DateCell from './types/Date';
import Checkbox from './types/Checkbox';


describe('Cell Types', () => {
  describe('Date', () => {
    it('renders date', () => {
      const timeStamp = '2020-10-06T14:07:39.033Z';
      const { container } = render(<DateCell data={timeStamp} />);
      const dateMatch = /October\s6th\s2020,\s[\d]{1,2}:07\s[A|P]M/; // Had to account for timezones in CI
      const sp = container.querySelector('span');
      expect(sp.textContent).toMatch(dateMatch);
    });
  });

  describe('Checkbox', () => {
    it('renders true', () => {
      const { getByText } = render(<Checkbox data />);
      const linkElement = getByText(/true/i);
      expect(linkElement).toBeInTheDocument();
    });
    it('renders false', () => {
      const { getByText } = render(<Checkbox data={false} />);
      const linkElement = getByText(/false/i);
      expect(linkElement).toBeInTheDocument();
    });
  });
});
