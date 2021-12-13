import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import { Props } from '../types';
import Label from '../../Label';

import './index.scss';

const baseClass = 'text-diff';

const Text: React.FC<Props> = ({ field, locale, revision, comparison }) => {
  return (
    <div className={baseClass}>
      <Label>
        {locale && (
          <span className={`${baseClass}__locale-label`}>{locale}</span>
        )}
        {field.label}
      </Label>
      <ReactDiffViewer
        oldValue={String(revision)}
        newValue={String(comparison)}
        splitView
        hideLineNumbers
        showDiffOnly={false}
      />
    </div>
  );

  return null;
};

export default Text;
