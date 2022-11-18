import React, { Suspense, useCallback } from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import PlaygroundApp from './App';

import './index.css';
import Loading from '../../../elements/Loading';

const baseClass = 'lexicalRichTextEditor';

const LexicalRichText: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <LexicalRichText2 {...props} />
  </Suspense>
);
const LexicalRichText2: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    label,
    required,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
    } = {},
  } = props;

  const path = pathFromProps || name;


  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useField({
    path,
    condition,
  });

  return (
    <div
      className={[
        'field-type',
        baseClass,
        showError && 'error',
        className,
        value && `${baseClass}--checked`,
        readOnly && `${baseClass}--read-only`,
      ].filter(Boolean).join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
      </div>
      <PlaygroundApp />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(LexicalRichText);
