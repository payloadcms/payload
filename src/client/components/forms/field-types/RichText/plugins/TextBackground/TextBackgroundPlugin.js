import { onKeyDownMark } from '@udecode/slate-plugins';

import { renderLeafTextBackground } from './renderLeafTextBackground';

export const TextBackgroundPlugin = (options = {}) => ({
  renderLeaf: renderLeafTextBackground(options),
  onKeyDown: onKeyDownMark(
    options.typeBackground ?? 'text-background',
    options.hotkey,
  ),
});
