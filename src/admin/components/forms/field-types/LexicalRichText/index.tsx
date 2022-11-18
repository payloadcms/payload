import React, { Suspense, useCallback } from 'react';
import { EditorState, LexicalEditor } from 'lexical';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { PlaygroundApp } from './App';

import './index.scss';
import Loading from '../../../elements/Loading';
import { lexicalRichText as lexicalRichTextValidation } from '../../../../../fields/validations';

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
    validate = lexicalRichTextValidation,
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

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);


  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useField({
    path,
    condition,
    validate: memoizedValidate,
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
      <PlaygroundApp
        onChange={(editorState: EditorState, editor: LexicalEditor) => {
          const json = editorState.toJSON();
          if (!readOnly && /* json !== defaultValue && */ json !== value) {
            setValue(json);
          }
        }}
        initialJSON={value}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(LexicalRichText);
