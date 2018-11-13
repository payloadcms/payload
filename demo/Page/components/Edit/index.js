import React, { Component } from 'react';
import {
  EditView,
  Sticky,
  APIUrl,
  Button,
  Form,
  Input,
  Textarea,
  Group,
  FormSubmit
} from 'payload/components';

import Page from '../../Page.config';
import payloadConfig from '../../../payload.config.json';

class Edit extends Component {

  constructor(props) {
    super(props);
    this.collection = Page;
    this.state = {
      collection: this.collection,
      data: false,
      isEditing: this.props.match.params.slug ? true : false
    }
  }

  render() {
      return (
        <EditView isEditing={this.state.isEditing} data={this.state.data}
          collection={this.state.collection} slug={this.props.match.params.slug}>
          <Form method="post" action={`${payloadConfig.serverUrl}/${this.state.collection.slug}`}>
            <Sticky>
              <APIUrl serverUrl={payloadConfig.serverUrl}
                collectionSlug={this.state.collection.slug} slug={this.props.match.params.slug} />
              <div className="controls">
                <Button type="secondary">Preview</Button>
                <FormSubmit>Save</FormSubmit>
              </div>
            </Sticky>
            <Input type="text" label="Page Title" name="title" required />
            <Group heading="Sample Group">
              <Textarea required name="content" label="Page Content" wysiwyg={false} height={100} />
            </Group>
          </Form>
        </EditView>
      );

  }
}

export default Edit;
