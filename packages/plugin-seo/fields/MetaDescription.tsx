/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
import React, { useCallback } from 'react';
import { Props as TextFieldType } from 'payload/dist/admin/components/forms/field-types/Text/types';
import { useFieldType, useWatchForm } from 'payload/components/forms';
import { FieldType as UseFieldType, Options } from 'payload/dist/admin/components/forms/useFieldType/types';
import { LengthIndicator } from '../ui/LengthIndicator';
import { defaults } from '../defaults';
import { generateMetaDescription } from '../utilities/generateMetaDescription';

const {
  minLength,
  maxLength,
} = defaults.description;

export const MetaDescription: React.FC<TextFieldType> = (props) => {
  const {
    label,
  } = props;

  const { fields } = useWatchForm();

  const field: UseFieldType<string> = useFieldType(props as Options);

  const {
    value,
    setValue,
  } = field;

  const generate = useCallback(() => {
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
        <textarea
          onChange={(e) => setValue(e.target.value)}
          value={value}
          style={{
            width: '100%',
            padding: '10px',
            fontFamily: 'inherit',
            fontStyle: 'normal',
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
