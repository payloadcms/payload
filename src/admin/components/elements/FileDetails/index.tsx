import React, { useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { useTranslation } from 'react-i18next';
import Thumbnail from '../Thumbnail';
import Button from '../Button';
import Meta from './Meta';
import Chevron from '../../icons/Chevron';
import { Props } from './types';
import { FileSizes, Upload } from '../../../../uploads/types';

import './index.scss';

const baseClass = 'file-details';

// sort to the same as imageSizes
const sortSizes = (sizes: FileSizes, imageSizes: Upload['imageSizes']) => {
  if (!imageSizes || imageSizes.length === 0) return sizes;

  const orderedSizes: FileSizes = {};

  imageSizes.forEach(({ name }) => {
    if (sizes[name]) {
      orderedSizes[name] = sizes[name];
    }
  });

  return orderedSizes;
};

const FileDetails: React.FC<Props> = (props) => {
  const {
    doc,
    collection,
    handleRemove,
  } = props;

  const {
    upload: {
      staticURL,
      imageSizes,
    },
  } = collection;

  const {
    filename,
    filesize,
    width,
    height,
    mimeType,
    sizes,
    url,
  } = doc;

  const [orderedSizes, setOrderedSizes] = useState<FileSizes>(() => sortSizes(sizes, imageSizes));

  useEffect(() => {
    setOrderedSizes(sortSizes(sizes, imageSizes));
  }, [sizes, imageSizes]);

  const [moreInfoOpen, setMoreInfoOpen] = useState(false);
  const { t } = useTranslation('upload');

  const hasSizes = sizes && Object.keys(sizes)?.length > 0;

  return (
    <div className={baseClass}>
      <header>
        <Thumbnail
          doc={doc}
          collection={collection}
        />
        <div className={`${baseClass}__main-detail`}>
          <Meta
            staticURL={staticURL}
            filename={filename as string}
            filesize={filesize as number}
            width={width as number}
            height={height as number}
            mimeType={mimeType as string}
            url={url as string}
          />
          {hasSizes && (
            <Button
              className={`${baseClass}__toggle-more-info${moreInfoOpen ? ' open' : ''}`}
              buttonStyle="none"
              onClick={() => setMoreInfoOpen(!moreInfoOpen)}
            >
              {!moreInfoOpen && (
                <React.Fragment>
                  {t('moreInfo')}
                  <Chevron />
                </React.Fragment>
              )}
              {moreInfoOpen && (
                <React.Fragment>
                  {t('lessInfo')}
                  <Chevron />
                </React.Fragment>
              )}
            </Button>
          )}
        </div>
        {handleRemove && (
          <Button
            icon="x"
            round
            buttonStyle="icon-label"
            iconStyle="with-border"
            onClick={handleRemove}
            className={`${baseClass}__remove`}
          />
        )}
      </header>
      {hasSizes && (
        <AnimateHeight
          className={`${baseClass}__more-info`}
          height={moreInfoOpen ? 'auto' : 0}
        >
          <ul className={`${baseClass}__sizes`}>
            {Object.entries(orderedSizes).map(([key, val]) => {
              if (val?.filename) {
                return (
                  <li key={key}>
                    <div className={`${baseClass}__size-label`}>
                      {key}
                    </div>
                    <Meta
                      {...val}
                      mimeType={val.mimeType}
                      staticURL={staticURL}
                    />
                  </li>
                );
              }

              return null;
            })}
          </ul>
        </AnimateHeight>
      )}

    </div>
  );
};

export default FileDetails;
