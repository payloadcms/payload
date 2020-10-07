import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render } from '@testing-library/react';
import Separator from './components/elements/Paginator/Separator';

describe('Components', () => {
  describe('Paginator', () => {
    it('separator - renders dash', () => {
      const { getByText } = render(<Separator />);
      const linkElement = getByText(/—/i); // &mdash;
      expect(linkElement).toBeInTheDocument();
    });
  });
});
