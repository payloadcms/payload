import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types.js';
import Thumbnail from '../Thumbnail/index.js';
import { useConfig } from '../../utilities/Config/index.js';
import { formatUseAsTitle } from '../../../hooks/useTitle.js';

import './index.scss';

const baseClass = 'thumbnail-card';

export const ThumbnailCard: React.FC<Props> = (props) => {
  const {
    className,
    onClick,
    doc,
    collection,
    thumbnail,
    label: labelFromProps,
    alignLabel,
  } = props;

  const { t, i18n } = useTranslation('general');
  const config = useConfig();

  const classes = [
    baseClass,
    className,
    typeof onClick === 'function' && `${baseClass}--has-on-click`,
    alignLabel && `${baseClass}--align-label-${alignLabel}`,
  ].filter(Boolean).join(' ');

  let title = labelFromProps;

  if (!title) {
    title = formatUseAsTitle({
      doc,
      collection,
      i18n,
      config,
    }) || doc?.filename as string || `[${t('untitled')}]`;
  }

  return (
    <button
      type="button"
      title={title}
      className={classes}
      onClick={onClick}
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
        {title}
      </div>
    </button>
  );
};
