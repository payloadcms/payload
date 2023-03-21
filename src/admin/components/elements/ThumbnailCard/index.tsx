import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import Thumbnail from '../Thumbnail';
import { useConfig } from '../../utilities/Config';
import { formatUseAsTitle } from '../../../hooks/useTitle';

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
    onKeyDown,
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
        {title}
      </div>
    </div>
  );
};
