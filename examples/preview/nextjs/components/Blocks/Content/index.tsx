import React from 'react';
import { Page } from '../../../payload-types';
import RichText from '../../RichText';
import { Gutter } from '../../Gutter';
import classes from './index.module.scss';

type Props = Extract<Page['layout'][0], { blockType: 'content' }>

export const ContentBlock: React.FC<Props> = ({ richText }) => {
  return (
    <Gutter className={classes.contentBlock}>
      <RichText content={richText} />
    </Gutter>
  )
}
