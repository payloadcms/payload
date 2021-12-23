import React from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import Label from '../../Label';
import { Props } from '../types';
import { richTextToHTML } from './richTextToHTML';
import { stringifyRichText } from './stringifyRichText';

import './index.scss';

const baseClass = 'text-diff';

const Text: React.FC<Props> = ({ field, locale, revision, comparison, isRichText = false }) => {
  let placeholder = '';

  if (revision === comparison) placeholder = '[no value]';

  let revisionToRender = revision;
  let comparisonToRender = comparison;

  if (isRichText) {
    // if (typeof revision === 'object') revisionToRender = stringifyRichText(revision);
    // if (typeof comparison === 'object') comparisonToRender = stringifyRichText(comparison);
    if (typeof revision === 'object') revisionToRender = richTextToHTML(revision);
    if (typeof comparison === 'object') comparisonToRender = richTextToHTML(comparison);
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
        // renderContent={(str) => {
        //   if (isRichText) {
        //     // console.log(str);
        //     return (
        //       <div
        //         className={`${baseClass}__rich-text`}
        //         dangerouslySetInnerHTML={{ __html: str }}
        //       />
        //     );
        //   }

        //   return <pre>{str}</pre>;
        // }}
      />
    </div>
  );

  return null;
};

export default Text;
