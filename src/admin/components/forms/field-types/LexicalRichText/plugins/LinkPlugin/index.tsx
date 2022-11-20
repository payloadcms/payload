/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LinkPlugin as LexicalLinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import * as React from 'react';

import {validateUrl} from '../../utils/url';

export default function LinkPlugin(): JSX.Element {
  return <LexicalLinkPlugin /* validateUrl={validateUrl} */ />;
}
