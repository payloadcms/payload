import React from 'react';
import {
  withListData,
  ListView,
  HeadingButton,
  SearchableTable,
} from 'payload/components';

const List = props => {
  return (
    <ListView collection={props.collection}>
      <HeadingButton
        heading="Pages"
        buttonLabel="Add New"
        buttonUrl={`/collections/${props.collection.slug}/create`}
        buttonType="link" />
      <SearchableTable data={props.data.docs} collection={props.collection} />
    </ListView>
  );
}

export default withListData(List);
