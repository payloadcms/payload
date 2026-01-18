'use client';

import { createClientFeature } from '../../../../utilities/createClientFeature.js';
import { TreeViewPlugin } from './plugin/index.js';
export const TreeViewFeatureClient = createClientFeature({
  plugins: [{
    Component: TreeViewPlugin,
    position: 'bottom'
  }]
});
//# sourceMappingURL=index.js.map