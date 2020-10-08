import React from 'react';
import { render } from '@testing-library/react';
import Separator from './Paginator/Separator';

describe('Elements', () => {
  describe('Paginator', () => {
    it('separator - renders dash', () => {
      const { getByText } = render(<Separator />);
      const linkElement = getByText(/—/i); // &mdash;
      expect(linkElement).toBeInTheDocument();
    });
  });
});
