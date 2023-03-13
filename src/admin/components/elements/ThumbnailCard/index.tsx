import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import Thumbnail from '../Thumbnail';

import './index.scss';

const baseClass = 'thumbnail-card';

export const ThumbnailCard: React.FC<Props> = (props) => {
  const {
    className,
    onClick,
    doc,
    collection,
    collection: {
      admin: {
        useAsTitle,
      },
    },
    thumbnail,
    label,
    alignLabel,
    onKeyDown,
  } = props;

  const { t } = useTranslation('general');

  const classes = [
    baseClass,
    className,
    typeof onClick === 'function' && `${baseClass}--has-on-click`,
    alignLabel && `${baseClass}--align-label-${alignLabel}`,
  ].filter(Boolean).join(' ');

  const title: any = doc?.[useAsTitle] || doc?.filename || `[${t('untitled')}]`;

  return (
    <div
      className={classes}
      onClick={typeof onClick === 'function' ? onClick : undefined}
      onKeyDown={typeof onKeyDown === 'function' ? onKeyDown : undefined}
    >
      <div className={`${baseClass}__thumbnail`}>
        {thumbnail && thumbnail}
        {!thumbnail && (collection && doc) && (
          <Thumbnail
            size="expand"
            doc={doc}
            collection={collection}
          />
        )}
      </div>
      <div className={`${baseClass}__label`}>
        {label || title}
      </div>
    </div>
  );
};
