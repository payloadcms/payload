import * as React from 'react';
import useThrottledEffect from '../../../hooks/useThrottledEffect.js';

type Props = {
  buildRowErrors: () => void;
};
export const WatchFormErrors: React.FC<Props> = ({ buildRowErrors }) => {
  useThrottledEffect(() => {
    buildRowErrors();
  }, 250, [buildRowErrors]);

  return null;
};
