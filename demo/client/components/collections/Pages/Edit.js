import React, { Component } from 'react';
import { connect } from 'react-redux';

import EditView from 'payload/client/components/views/collections/Edit';
import Form from 'payload/client/components/forms/Form';
import Input from 'payload/client/components/forms/Input';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Edit extends Component {
  constructor(props) {
    super(props);
    this.slug = 'pages';
    this.collection = this.props.collections[this.slug];
  }

  render() {
    return (
      <EditView
        id={this.props.match.params.id}
        slug={this.slug}
        collection={this.collection}>
        <h1>Edit {this.collection.attrs.singular} {this.props.match.params.id}</h1>
        <Form method="POST" action="#">
          <Input type="email" label="Email Address" name="email" required />
        </Form>
      </EditView>
    );
  }
}

export default connect(mapStateToProps)(Edit);
