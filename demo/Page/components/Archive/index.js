import React from 'react';
import {
  withArchiveData,
  ArchiveView,
  HeadingButton,
  SearchableTable,
} from 'payload/components';

const Archive = props => {
  return (
    <ArchiveView collection={props.collection}>
      <HeadingButton
        heading="Pages"
        buttonLabel="Add New"
        buttonUrl={`/collections/${props.collection.slug}/create`}
        buttonType="link" />
      <SearchableTable data={props.data.docs} collection={props.collection} />
    </ArchiveView>
  );
}

export default withArchiveData(Archive);
