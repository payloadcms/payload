import { getRenderElement } from '@udecode/slate-plugins';

import { nodeTypes } from '../../../types';
import BlockquoteElement from './Components/blockquote';

const renderElementBlockquote = ({
  typeBlockquote = nodeTypes.typeBlockquote,
  component = BlockquoteElement,
}) => getRenderElement({
  type: typeBlockquote,
  component,
});

export default renderElementBlockquote;
