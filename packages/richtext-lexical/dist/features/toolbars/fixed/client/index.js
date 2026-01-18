'use client';

import { createClientFeature } from '../../../../utilities/createClientFeature.js';
import { FixedToolbarPlugin } from './Toolbar/index.js';
export const FixedToolbarFeatureClient = createClientFeature({
  plugins: [{
    Component: FixedToolbarPlugin,
    position: 'aboveContainer'
  }]
});
//# sourceMappingURL=index.js.map