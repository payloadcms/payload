import React from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import Label from '../../Label';
import { Props } from '../types';

import './index.scss';

const baseClass = 'text-diff';

const Text: React.FC<Props> = ({ field, locale, version, comparison, isRichText = false, diffMethod }) => {
  let placeholder = '';

  if (version === comparison) placeholder = '[no value]';

  let versionToRender = version;
  let comparisonToRender = comparison;

  if (isRichText) {
    if (typeof version === 'object') versionToRender = JSON.stringify(version, null, 2);
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
        compareMethod={DiffMethod[diffMethod]}
        oldValue={typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder}
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
