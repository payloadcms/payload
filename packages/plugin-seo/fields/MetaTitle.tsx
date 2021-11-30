/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
import React, { useCallback } from 'react';
import { Props as TextFieldType } from 'payload/dist/admin/components/forms/field-types/Text/types';
import TextField from 'payload/dist/admin/components/forms/field-types/Text';
import { useField, useWatchForm } from 'payload/components/forms';
import { FieldType as FieldType, Options } from 'payload/dist/admin/components/forms/useField/types';
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

  const field: FieldType<string> = useField(props as Options);

  const { fields } = useWatchForm();

  const {
    value,
    setValue,
  } = field;

  const regenerateTitle = useCallback(() => {
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
            onClick={regenerateTitle}
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
          {`This should be between ${minLength} and ${maxLength} characters. Auto-generation will format a title using the page title. For help in writing quality meta titles, see `}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/title-link#page-titles"
            rel="noopener noreferrer"
            target="_blank"
            style={{
              color: '-webkit-link',
              textDecoration: 'none',
            }}
          >
            best practices
          </a>
          .
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          marginBottom: '10px',
        }}
      >
        <TextField
          name=""
          onChange={setValue}
          value={value}
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
