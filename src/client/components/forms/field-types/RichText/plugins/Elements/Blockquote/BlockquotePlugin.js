import renderElementBlockquote from './renderElementBlockquote';
import onKeyDown from './KeyDownHandler';

const BlockquotePlugin = (options = {}) => ({
  renderElement: renderElementBlockquote(options),
  onKeyDown: e => onKeyDown(e, options),
});

export default BlockquotePlugin;
