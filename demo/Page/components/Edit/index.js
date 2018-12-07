import React, { Component } from 'react';
import {
  withEditData,
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
import { toKebabCase } from 'payload/utils';

import Page from '../../Page.config';
import config from '../../../payload.config.json';

class Edit extends Component {

  constructor(props) {
    super(props);
    this.collection = Page;

    this.state = {
      uid: this.props.match.params.slug,
      slug: this.props.match.params.slug
    }

    this.updateSlug = this.updateSlug.bind(this);
  }

  updateSlug(e) {
    this.setState({ slug: toKebabCase(e.target.value) });
  }

  render() {

    const initialData = this.props.data ? this.props.data : {};

    return (
      <EditView data={this.props.data} collection={this.collection} slug={this.state.slug} uid={this.state.uid}>
        <Form method="post" action={`${config.serverUrl}/${this.collection.slug}`}>
          <Sticky>
            <APIUrl serverUrl={config.serverUrl}
              collectionSlug={this.collection.slug} slug={this.state.slug} />
            <div className="controls">
              <Button type="secondary">Preview</Button>
              <FormSubmit>Save</FormSubmit>
            </div>
          </Sticky>
          <Input onChange={this.updateSlug} type="text" label="Page Title" value={initialData.title} name="title" required />
          <Group heading="Sample Group">
            <Textarea required name="content" label="Page Content" wysiwyg={false} height={100} value={initialData.content} />
          </Group>
        </Form>
      </EditView>
    );
  }
}

export default withEditData(Edit, Page, config);
