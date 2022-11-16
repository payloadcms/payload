import React, { useCallback } from 'react';
import { useField, useAllFormFields } from 'payload/components/forms';
import { useLocale } from 'payload/components/utilities';
import { FieldType, Options } from 'payload/dist/admin/components/forms/useField/types';
import { LengthIndicator } from '../ui/LengthIndicator';
import { defaults } from '../defaults';
import TextareaInput from 'payload/dist/admin/components/forms/field-types/Textarea/Input';
import { TextareaField } from 'payload/dist/fields/config/types';
import { SEOConfig } from '../types';

const {
  minLength,
  maxLength,
} = defaults.description;

type TextareaFieldWithProps = TextareaField & {
  path: string
  seoConfig: SEOConfig
};

export const MetaDescription: React.FC<(TextareaFieldWithProps | {}) & {
  seoConfig: SEOConfig
}> = (props) => {
  const {
    path,
    label,
    name,
    seoConfig,
  } = props as TextareaFieldWithProps || {}; // TODO: this typing is temporary until payload types are updated for custom field props

  const locale = useLocale();
  const [fields] = useAllFormFields();

  const field: FieldType<string> = useField({
    label,
    name,
    path
  } as Options);

  const {
    value,
    setValue,
    showError
  } = field;

  const regenerateDescription = useCallback(() => {
    const { generateDescription } = seoConfig;

    const getDescription = async () => {
      let generatedDescription;
      if (typeof generateDescription === 'function') {
        generatedDescription = await generateDescription({ doc: { ...fields }, locale });
      }
      setValue(generatedDescription);
    }
    getDescription();
  }, [
    fields,
    setValue,
    seoConfig,
    locale
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
              color: 'currentcolor',
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

export const getMetaDescriptionField = (props: any) => (
  <MetaDescription {...props} />
)
