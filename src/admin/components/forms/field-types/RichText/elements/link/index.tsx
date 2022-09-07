import { withLinks } from './utilities';
import { LinkButton } from './Button';
import { LinkElement } from './Element';

const link = {
  Button: LinkButton,
  Element: LinkElement,
  plugins: [
    withLinks,
  ],
};

export default link;
