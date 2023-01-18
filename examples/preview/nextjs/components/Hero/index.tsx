import React from 'react';
import { Page } from '../../payload-types';
import { Gutter } from '../Gutter';
import RichText from '../RichText';

import classes from './index.module.scss';

export const Hero: React.FC<Page['hero']> = ({ richText }) => {
  return (
    <Gutter className={classes.hero}>
      <RichText content={richText} />
    </Gutter>
  )
}
