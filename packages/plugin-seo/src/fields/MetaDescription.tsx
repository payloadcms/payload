/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
import React, { useCallback } from 'react';
import { Props as TextFieldType } from 'payload/dist/admin/components/forms/field-types/Text/types';
import { useField, useWatchForm } from 'payload/components/forms';
import { FieldType, Options } from 'payload/dist/admin/components/forms/useField/types';
import { LengthIndicator } from '../ui/LengthIndicator';
import { defaults } from '../defaults';
import { generateMetaDescription } from '../utilities/generateMetaDescription';
import TextareaInput from 'payload/dist/admin/components/forms/field-types/Textarea/Input';

const {
  minLength,
  maxLength,
} = defaults.description;

export const MetaDescription: React.FC<TextFieldType> = (props) => {
  const {
    label,
    name
  } = props;

  const { fields } = useWatchForm();

  const field: FieldType<string> = useField(props as Options);

  const {
    value,
    setValue,
    showError
  } = field;

  const regenerateDescription = useCallback(() => {
    const generatedDesc = generateMetaDescription(fields);
    setValue(generatedDesc);
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
            onClick={regenerateDescription}
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
          {`This should be between ${minLength} and ${maxLength} characters. Auto-generation will format a description using the page content. For help in writing quality meta descriptions, see `}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/snippet#meta-descriptions"
            rel="noopener noreferrer"
            target="_blank"
            style={{
              color: '-webkit-link',
              textDecoration: 'none',
            }}
          >
            best practices
          </a>
        </div>
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <TextareaInput
          path={name}
          name={name}
          onChange={setValue}
          value={value}
          showError={showError}
          style={{
            marginBottom: 0
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
