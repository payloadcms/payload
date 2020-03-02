import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Filter from '../Filter';
import Table from '../../layout/Table';
import config from '../../../config/sanitizedClientConfig';

const { routes: { admin } } = config;

class SearchableTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rows: this.structureRows(this.props.data),
      columns: [{
        key: 'title',
        label: 'Title',
      }, {
        key: '_id',
        label: 'ID',
      }, {
        key: 'createdAt',
        label: 'Created At',
        handler: time => new Date(time).toDateString(),
      }],
    };
  }

  structureRows = () => {
    if (this.props.data) {
      return this.props.data.map((row) => {
        const formattedRow = { ...row };

        const url = `${admin}/collections/${this.props.collection.slug}/${row.id}`;

        // Link the first column
        formattedRow[this.state.columns[0].key] = <Link to={url}>{row[this.state.columns[0].key]}</Link>;
        return formattedRow;
      });
    }

    return [];
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState({
        rows: this.structureRows(this.props.data),
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <Filter />
        <Table
          rows={this.state.rows}
          columns={this.state.columns}
        />
      </React.Fragment>
    );
  }
}

export default SearchableTable;
