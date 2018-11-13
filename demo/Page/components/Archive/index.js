import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ArchiveView, HeadingButton, Filter } from 'payload/components';
import api from 'payload/api';

import payloadConfig from '../../../payload.config.json';
import Page from '../../Page.config';

class Archive extends Component {
  constructor(props) {
    super(props);
    this.collection = Page;

    this.state = {
      collection: this.collection,
      data: false
    }
  }

  componentDidMount() {
    api.requests.get(`${payloadConfig.serverUrl}/${this.state.collection.slug}`).then(
      res =>
        this.setState({ data: res }),
      err =>
        console.warn(err)
    )
  }

  render() {
    return (
      <ArchiveView slug={this.state.collection.slug} collection={this.state.collection}>
        <HeadingButton
          heading="Pages"
          buttonLabel="Add New"
          buttonUrl={`/collections/${this.state.collection.slug}/create`}
          buttonType="link" />
        <Filter />
        {this.state.data &&
          <ul>
            {this.state.data.map((row, i) => {
              const slug = row[this.state.collection.uid];
              return (
                <li key={i}>
                  <Link to={`/collections/${this.state.collection.slug}/${slug}`}>
                    {row.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        }
      </ArchiveView>
    );
  }
}

export default Archive;
