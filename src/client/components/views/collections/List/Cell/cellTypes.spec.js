import React from 'react';
import { render } from '@testing-library/react';
import DateCell from './types/Date';
import Checkbox from './types/Checkbox';


describe('Cell Types', () => {
  describe('Date', () => {
    it('renders date', () => {
      const timeStamp = '2020-10-06T14:07:39.033Z';
      const { getByText } = render(<DateCell data={timeStamp} />);
      const linkElement = getByText(/October 6th 2020, 10:07 AM/i);
      expect(linkElement).toBeInTheDocument();
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
