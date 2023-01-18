import { Cell, Grid } from '@faceless-ui/css-grid';
import React from 'react';
import { Page } from '../../../payload-types';
import { Gutter } from '../../Gutter';
import { CMSLink } from '../../Link';
import RichText from '../../RichText';

import classes from './index.module.scss';

export const HighImpactHero: React.FC<Page['hero']> = ({ richText, media, links }) => {

  return (
    <Gutter className={classes.hero}>
      <Grid>
        <Cell cols={10} colsM={4}>
          <RichText content={richText} />
        </Cell>
      </Grid>
      <div className={classes.media}>
        {Array.isArray(links) && (
          <ul className={classes.links}>
            {links.map(({ link }, i) => {
              return (
                <li key={i}>
                  <CMSLink {...link} />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Gutter>
  )
}
