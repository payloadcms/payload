import React, { Component } from 'react';
import {
  withEditData,
  EditView,
  StickyAction,
  APIUrl,
  Button,
  Form,
  Input,
  HiddenInput,
  Textarea,
  Group,
  FormSubmit,
  Repeater
} from 'payload/components';
import { toKebabCase, convertArrayToObject } from 'payload/utils';

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
    const fields = convertArrayToObject(this.props.collection.fields, 'name');

    return (
      <EditView data={this.props.data} collection={this.props.collection}>
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

          <HiddenInput
          name="slug"
          valueOverride={this.state.slug} />

          <Input name="title"
          onChange={this.setSlug}
          label="Page Title"
          maxLength={100}
          initialValue={initialData['title']}
          required/>

          <Textarea name="content"
          label="Content"
          initialValue={initialData['content']}
          height={100}
          required />

          <Repeater
          name="slides"
          label="Slides"
          initialValue={initialData['slides']}>
            <Textarea name="content" label="Content" />
          </Repeater>

          <Group label="Meta Information">
            <Input name="metaTitle"
            maxLength={100}
            label="Meta Title"
            width={50} />

            <Input name="metaKeywords"
            maxLength={100}
            label="Meta Keywords"
            width={50} />

            <Textarea name="metaDesc"
            label="Meta Description"
            height={100} />
          </Group>
        </Form>
      </EditView>
    );
  }
}

export default withEditData(Edit);
