import * as React from 'react';
import useThrottledEffect from '../../../hooks/useThrottledEffect';

type Props = {
  calculateNestedErrorPaths: () => void;
};
export const WatchFormErrors: React.FC<Props> = ({ calculateNestedErrorPaths }) => {
  useThrottledEffect(() => {
    calculateNestedErrorPaths();
  }, 250, [calculateNestedErrorPaths]);

  return null;
};
