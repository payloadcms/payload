import React from 'react';
import {
  withArchiveData,
  ArchiveView,
  HeadingButton,
  SearchableTable,
} from 'payload/components';

import Page from '../../Page.config';
import config from '../../../payload.config.json';

const collection = Page;

const Archive = props => {

  return (
    <ArchiveView collection={collection}>
      <HeadingButton
        heading="Pages"
        buttonLabel="Add New"
        buttonUrl={`/collections/${collection.slug}/create`}
        buttonType="link" />
      <SearchableTable data={props.data} collection={collection} />
    </ArchiveView>
  );
}

export default withArchiveData(Archive, collection, config);
