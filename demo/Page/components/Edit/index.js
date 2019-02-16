import React from 'react';
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

const Edit = props => {

  const { id } = props.match.params;

  const { data, collection, config, locale } = props;

  const sampleRepeaterValue = [
    {
      content: 'here\'s some test content'
    }, {
      content: 'here\'s some more test content'
    }
  ];

  return (
    <EditView data={data} collection={collection} isEditing={id ? true : false}>
      <Form method={id ? 'put' : 'post'} action={`${config.serverUrl}/${collection.slug}${id ? `/${id}` : ''}`}>
        <StickyAction content={
          <APIUrl />
        } action={
          <React.Fragment>
            <Button type="secondary">Preview</Button>
            <FormSubmit>Save</FormSubmit>
          </React.Fragment>
        } />

        <HiddenInput
          name="locale"
          valueOverride={locale} />

        <HiddenInput
          name="slug"
          valueOverride={id} />

        <Input name="title"
          label="Page Title"
          maxLength={100}
          initialValue={data['title']}
          required />

        <Textarea name="content"
          label="Content"
          initialValue={data['content']}
          height={100}
          required />

        <Repeater
          name="slides"
          label="Slides"
          initialValue={sampleRepeaterValue}>
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

export default withEditData(Edit);
