import { withLinks } from './utilities.js';
import { LinkButton } from './Button/index.js';
import { LinkElement } from './Element/index.js';

const link = {
  Button: LinkButton,
  Element: LinkElement,
  plugins: [
    withLinks,
  ],
};

export default link;
