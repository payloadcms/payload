import { renderElementHeading } from './renderElementHeading';

export const HeadingPlugin = (options = {}) => ({
  renderElement: renderElementHeading(options),
});
