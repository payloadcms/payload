import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import Label from '../../Label';
import { Props } from '../types';

import './index.scss';

const baseClass = 'text-diff';

const Text: React.FC<Props> = ({ field, locale, revision, comparison }) => {
  let placeholder = '';

  if (revision === comparison) placeholder = '[no value]';

  return (
    <div className={baseClass}>
      <Label>
        {locale && (
          <span className={`${baseClass}__locale-label`}>{locale}</span>
        )}
        {field.label}
      </Label>
      <ReactDiffViewer
        oldValue={typeof revision !== 'undefined' ? String(revision) : placeholder}
        newValue={typeof comparison !== 'undefined' ? String(comparison) : placeholder}
        splitView
        hideLineNumbers
        showDiffOnly={false}
      />
    </div>
  );

  return null;
};

export default Text;
