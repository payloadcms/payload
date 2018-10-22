import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  AddView,
  StickOnScroll,
  APIUrl,
  Button,
  Form,
  Input,
  Textarea,
  Group
} from 'payload/components';
import payloadConfig from '../../../../../payload.config.json';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Add extends Component {
  constructor(props) {
    super(props);
    this.slug = 'orders';
    this.collection = this.props.collections.find(collection => {
      return collection.slug === this.slug;
    });
    this.state = {
      apiUrl: 'https://site.com/order?slug=test'
    };
  }

  render() {
    return (
      <AddView slug={this.slug} collection={this.collection}>
        <header>
          <h1>Add New Order</h1>
        </header>
        <StickOnScroll>
          <APIUrl url={this.state.apiUrl} />
          <div className="controls">
            <Button type="secondary">Preview</Button>
            <Button>Save</Button>
          </div>
        </StickOnScroll>
        <Form method="POST" action={`${payloadConfig.serverUrl}/orders`}>
          <Input type="email" label="Order Title" name="title" required />
          <Group heading="Meta Information">
            <Textarea name="description" label="Meta Description" wysiwyg={false} height={100} />
            <Input type="text" label="Meta Keywords" name="keywords" required />
          </Group>
          <Input type="email" label="Page Title" name="title" required />
          <Group heading="Meta Information">
            <Textarea name="description" label="Meta Description" wysiwyg={false} height={100} />
            <Input type="text" label="Meta Keywords" name="keywords" required />
          </Group>
          <Group heading="Meta Information">
            <Textarea name="description" label="Meta Description" wysiwyg={false} height={100} />
            <Input type="text" label="Meta Keywords" name="keywords" required />
          </Group>
        </Form>
      </AddView>
    );
  }
}

export default connect(mapStateToProps)(Add);
