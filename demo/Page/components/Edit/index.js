import React, { Component } from 'react';
import {
  withEditData,
  EditView,
  StickyAction,
  APIUrl,
  Button,
  Form,
  Input,
  Textarea,
  Group,
  FormSubmit
} from 'payload/components';
import { toKebabCase } from 'payload/utils';

class Edit extends Component {

  constructor(props) {
    super(props);

    const uid = this.props.match.params.slug;

    this.state = {
      uid: uid,
      slug: uid,
      action: `${this.props.config.serverUrl}/${this.props.collection.slug}${uid ? `/${uid}` : ''}`,
      method: uid ? 'put' : 'post'
    }
  }

  setSlug = e => {
    this.setState({ slug: toKebabCase(e.target.value) });
  }

  render() {

    const initialData = this.props.data ? this.props.data : {};

    return (
      <EditView data={this.props.data} collection={this.props.collection} slug={this.state.slug} uid={this.state.uid}>
        <Form method={this.state.method} action={this.state.action}>
          <StickyAction content={
            <APIUrl serverUrl={this.props.config.serverUrl}
            collectionSlug={this.props.collection.slug} slug={this.state.slug} />
          } action={
            <React.Fragment>
              <Button type="secondary">Preview</Button>
              <FormSubmit>Save</FormSubmit>
            </React.Fragment>
          } />
          <Input type="hidden" name="slug" valueOverride={this.state.slug} />
          <Input onChange={this.setSlug} type="text" label="Page Title" initialValue={initialData.title} name="title" required />
          <Textarea required name="content" label="Page Content" wysiwyg={false} height={100} initialValue={initialData.content} />
          <Group heading="Meta Information">
            <Input type="text" label="Meta Title" initialValue={initialData.metaTitle} name="metaTitle" required />
            <Textarea required name="metaDesc" label="Meta Description" wysiwyg={false} height={100} initialValue={initialData.metaDesc} />
          </Group>
        </Form>
      </EditView>
    );
  }
}

export default withEditData(Edit);
