import React, { useCallback } from 'react';
import { useConfig } from '@payloadcms/config-provider';
import { Props as UploadFieldType } from 'payload/dist/admin/components/forms/field-types/Upload/types';
import UploadInput from 'payload/dist/admin/components/forms/field-types/Upload/Input';
import { useField, useWatchForm } from 'payload/components/forms';
import { FieldType, Options } from 'payload/dist/admin/components/forms/useField/types';
import { Pill } from '../ui/Pill';
import { SEOConfig } from '../types';

type UploadFieldWithProps = UploadFieldType & {
  path: string
  seoConfig: SEOConfig
};

export const MetaImage: React.FC<UploadFieldWithProps | {}> = (props) => {
  const {
    label,
    relationTo,
    fieldTypes,
    name,
    seoConfig,
  } = props as UploadFieldWithProps || {}; // TODO: this typing is temporary until payload types are updated for custom field props

  const field: FieldType<string> = useField(props as Options);

  const { fields } = useWatchForm();

  const {
    value,
    setValue,
    showError,
  } = field;

  const regenerateImage = useCallback(() => {
    const { generateImage } = seoConfig;
    const getDescription = async () => {
      let generatedImage;
      if (typeof generateImage === 'function') {
        generatedImage = await generateImage({ doc: { ...fields } });
      }
      setValue(generatedImage);
    }
    getDescription();
  }, [
    fields,
    setValue,
    seoConfig
  ]);

  const hasImage = Boolean(value);

  const config = useConfig();

  const {
    collections,
    serverURL,
    routes: {
      api,
    } = {},
  } = config;

  const collection = collections?.find((coll) => coll.slug === relationTo) || undefined;

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
            onClick={regenerateImage}
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
          Auto-generation will retrieve the selected hero image.
        </div>
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <UploadInput
          path={name}
          fieldTypes={fieldTypes}
          name={name}
          relationTo={relationTo}
          value={value}
          onChange={(incomingImage) => {
            if (incomingImage !== null) {
              const { id: incomingID } = incomingImage;
              setValue(incomingID);
            } else {
              setValue(null);
            }
          }}
          label={undefined}
          showError={showError}
          api={api}
          collection={collection}
          serverURL={serverURL}
          style={{
            marginBottom: 0,
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
        <Pill
          backgroundColor={hasImage ? 'green' : 'red'}
          color="white"
          label={hasImage ? 'Good' : 'No Image'}
        />
      </div>
    </div>
  );
};

export const getMetaImageField = (props: any) => (
  <MetaImage {...props} />
)

