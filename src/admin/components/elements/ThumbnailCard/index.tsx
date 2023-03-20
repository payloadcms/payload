import React, { Fragment } from 'react';
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
    thumbnail,
    alignLabel,
    onKeyDown,
    label: labelFromProps,
  } = props;

  const { t } = useTranslation('general');

  const classes = [
    baseClass,
    className,
    typeof onClick === 'function' && `${baseClass}--has-on-click`,
    alignLabel && `${baseClass}--align-label-${alignLabel}`,
  ].filter(Boolean).join(' ');

  let label = labelFromProps;
  if (!label) label = typeof doc?.filename === 'string' ? doc?.filename : `[${t('untitled')}]`;

  return (
    <div
      title={label}
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
        {label}
      </div>
    </div>
  );
};
