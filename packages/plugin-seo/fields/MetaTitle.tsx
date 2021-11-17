/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
import React, { useCallback } from 'react';
import { Props as TextFieldType } from 'payload/dist/admin/components/forms/field-types/Text/types';
import { useFieldType, useWatchForm } from 'payload/components/forms';
import { FieldType as UseFieldType, Options } from 'payload/dist/admin/components/forms/useFieldType/types';
import { LengthIndicator } from '../ui/LengthIndicator';
import { defaults } from '../defaults';
import { generateMetaTitle } from '../utilities/generateMetaTitle';

const {
  minLength,
  maxLength,
} = defaults.title;

export const MetaTitle: React.FC<TextFieldType> = (props) => {
  const {
    label,
  } = props;

  const field: UseFieldType<string> = useFieldType(props as Options);

  const { fields } = useWatchForm();

  const {
    value,
    setValue,
  } = field;

  const generate = useCallback(() => {
    const generatedTitle = generateMetaTitle(fields);
    setValue(generatedTitle);
  }, [
    fields,
    setValue,
  ]);

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div>
          {label}
          &nbsp;
          &mdash;
          &nbsp;
          <button
            onClick={generate}
            type="button"
            style={{
              padding: 0,
              background: 'none',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Auto-generate
          </button>
        </div>
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          {`This should be between ${minLength} and ${maxLength} characters. Auto-generation will format a title using the page title.`}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          marginBottom: '10px',
        }}
      >
        <input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          style={{
            width: '100%',
            padding: '10px',
            display: 'flex',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <LengthIndicator
          text={value as string}
          minLength={minLength}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
};
