import { withLinks } from './utilities.js';
import { LinkButton } from './Button.js';
import { LinkElement } from './Element.js';

const link = {
  Button: LinkButton,
  Element: LinkElement,
  plugins: [
    withLinks,
  ],
};

export default link;
