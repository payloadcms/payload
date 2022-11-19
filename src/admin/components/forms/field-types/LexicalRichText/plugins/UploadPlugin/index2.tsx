import plugin from './plugin';
import UploadElement from './Element';
import Button from './Button';

export default {
  Button,
  Element: UploadElement,
  plugins: [
    plugin,
  ],
};
