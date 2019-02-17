import React from 'react';
import {
  withEditData,
  EditView,
  StickyHeader,
  APIUrl,
  Button,
  Form,
  Input,
  Textarea,
  Group,
  FormSubmit,
  Repeater
} from 'payload/components';

const Edit = props => {

  const { id } = props.match.params;
  const { data, collection, config } = props;

  function get(attribute) {
    // TODO: if the app is not using localization this will need to be revisited
    return data[attribute] && props.locale && data[attribute][props.locale] ? data[attribute][props.locale] : '';
  }

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
        <StickyHeader showStatus={true}
          content={
            <APIUrl />
          } action={
            <React.Fragment>
              <Button type="secondary">Preview</Button>
              <FormSubmit>Save</FormSubmit>
            </React.Fragment>
          } />

        <Input name="title"
          label="Page Title"
          maxLength={100}
          initialValue={get('title')}
          required />

        <Textarea name="content"
          label="Content"
          initialValue={get('content')}
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
