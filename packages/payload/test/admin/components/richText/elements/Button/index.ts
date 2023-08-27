import { RichTextCustomElement } from '../../../../../../src/fields/config/types.js';
import Button from './Button.js';
import Element from './Element.js';
import plugin from './plugin.js';

const button: RichTextCustomElement = {
  name: 'button',
  Button,
  Element,
  plugins: [
    plugin,
  ],
};

export default button;
