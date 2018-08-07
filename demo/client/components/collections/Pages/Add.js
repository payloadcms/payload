import React, { Component } from 'react';
import { connect } from 'react-redux';

import AddView from 'payload/client/components/views/collections/Add';
import Form from 'payload/client/components/forms/Form';
import Input from 'payload/client/components/field-types/Input';
import Textarea from 'payload/client/components/field-types/Textarea';
import Group from 'payload/client/components/field-types/Group';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Add extends Component {
  constructor(props) {
    super(props);
    this.slug = 'pages';
    this.collection = this.props.collections[this.slug];
  }

  render() {
    return (
      <AddView slug={this.slug} collection={this.collection}>
        <h1>Add New {this.collection.attrs.singular}</h1>
        <Form method="POST" action="#">
          <Input type="email" label="Page Title" name="title" required />
          <Group heading="Meta Info">
            <Textarea name="description" label="Meta Description" wysiwyg={false} height={100} />
            <Input type="text" label="Meta Keywords" name="keywords" required />
          </Group>
        </Form>
      </AddView>
    );
  }
}

export default connect(mapStateToProps)(Add);
