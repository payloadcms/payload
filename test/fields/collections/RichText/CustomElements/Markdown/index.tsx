import { Element } from './Element';
import { Button } from './Button';
import { withMarkdown } from './plugin';

export const elementIdentifier = 'markdown';

export const markdownElement = {
  name: elementIdentifier,
  Button,
  Element,
  plugins: [
    withMarkdown,
  ],
};
