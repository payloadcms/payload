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
  Group,
  FormSubmit
} from 'payload/components';
import payloadConfig from '../../../../../payload.config.json';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Add extends Component {
  constructor(props) {
    super(props);
    this.slug = 'pages';
    this.collection = this.props.collections.find(collection => {
      return collection.slug === this.slug;
    });
    this.state = {
      apiUrl: 'https://site.com/page?slug=about-us'
    };
  }

  render() {
    return (
      <AddView slug={this.slug} collection={this.collection}>
        <header>
          <h1>Add New Page</h1>
        </header>
        <Form method="POST" action={`${payloadConfig.serverUrl}/pages`}>
          <StickOnScroll>
            <APIUrl url={this.state.apiUrl} />
            <div className="controls">
              <Button type="secondary">Preview</Button>
              <FormSubmit>Save</FormSubmit>
            </div>
          </StickOnScroll>
          <Input type="text" label="Page Title" name="title" required />
          <Group heading="Sample Group">
            <Textarea required name="content" label="Page Content" wysiwyg={false} height={100} />
          </Group>
        </Form>
      </AddView>
    );
  }
}

export default connect(mapStateToProps)(Add);
