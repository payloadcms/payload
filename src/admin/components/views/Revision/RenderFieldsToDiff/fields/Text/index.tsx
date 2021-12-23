import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import Label from '../../Label';
import { Props } from '../types';

import './index.scss';

const baseClass = 'text-diff';

const Text: React.FC<Props> = ({ field, locale, revision, comparison, isRichText = false }) => {
  let placeholder = '';

  if (revision === comparison) placeholder = '[no value]';

  let revisionToRender = revision;
  let comparisonToRender = comparison;

  if (isRichText) {
    if (typeof revision === 'object') revisionToRender = JSON.stringify(revision, null, 2);
    if (typeof comparison === 'object') comparisonToRender = JSON.stringify(comparison, null, 2);
  }


  return (
    <div className={baseClass}>
      <Label>
        {locale && (
          <span className={`${baseClass}__locale-label`}>{locale}</span>
        )}
        {field.label}
      </Label>
      <ReactDiffViewer
        oldValue={typeof revisionToRender !== 'undefined' ? String(revisionToRender) : placeholder}
        newValue={typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder}
        splitView
        hideLineNumbers
        showDiffOnly={false}
      />
    </div>
  );

  return null;
};

export default Text;
