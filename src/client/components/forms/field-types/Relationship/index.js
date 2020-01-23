import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
import ReactSelect from '../../../modules/ReactSelect';
import useFieldType from '../../useFieldType';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const cookies = new Cookies();

const { serverURL, collections } = getSanitizedConfig();

const defaultError = 'Please make a selection.';
const defaultValidate = value => value.length > 0;

class Relationship extends Component {
  constructor(props) {
    super(props);

    const { relationTo } = this.props;
    const hasMultipleRelations = Array.isArray(relationTo);
    const relations = hasMultipleRelations ? relationTo : [relationTo];

    this.state = {
      relations,
      hasMultipleRelations,
      results: relations.reduce((acc, relation) => ({
        ...acc,
        [relation]: {
          docs: [],
          totalPages: null,
          page: 1,
        }
      }), {}),
      options: [],
    };
  }

  componentDidMount() {
    const { relations } = this.state;
    const token = cookies.get('token');

    relations.forEach((relation) => {
      fetch(`${serverURL}/${relation}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((res) => {
        res.json().then((json) => {
          const updatedResults = this.addResults(json, relation);
          const formattedOptions = this.formatOptions(updatedResults);

          this.setState({
            results: updatedResults,
            options: formattedOptions,
          })
        })
      })
    })
  }

  formatSelectedValue = (selectedValue) => {
    return selectedValue.value;
  }

  addResults = (incoming, relation) => {
    const { results } = this.state;

    return {
      ...results,
      [relation]: {
        totalPages: incoming.totalPages,
        page: incoming.page,
        docs: [
          ...results[relation].docs,
          ...incoming.docs,
        ]
      }
    }
  }

  formatOptions = (results) => {
    const { hasMultipleRelations } = this.state;

    return Object.keys(results).sort().reduce((acc, collectionSlug) => {
      const collectionResults = results[collectionSlug].docs;
      const collectionConfig = collections.find((collection) => collection.slug === collectionSlug);
      const optionGroup = {
        label: collectionConfig.labels.plural,
        options: collectionResults.map((result) => ({
          label: result[collectionConfig.useAsTitle],
          value: hasMultipleRelations ? {
            relationTo: collectionConfig.slug,
            value: result.id,
          } : result.id,
        })),
      };

      acc.push(optionGroup);
      return acc;
    }, []);
  }

  handleMenuScrollToBottom = () => {
    console.log('scrolled');
  }

  render() {
    const { options } = this.state;

    const {
      name,
      required,
      style,
      width,
      errorMessage,
      label,
      hasMany,
      value,
      showError,
      formProcessing,
      onFieldChange,
    } = this.props;

    const classes = [
      'field-type',
      'relationship',
      showError && 'error',
    ].filter(Boolean).join(' ');

    // eslint-disable-next-line prefer-template
    const fieldWidth = width ? width + '%' : null;

    return (
      <div
        className={classes}
        style={{
          ...style,
          width: fieldWidth,
        }}
      >
        <Error
          showError={showError}
          message={errorMessage}
        />
        <Label
          htmlFor={name}
          label={label}
          required={required}
        />
        <ReactSelect
          onChange={onFieldChange}
          formatValue={this.formatSelectedValue}
          onMenuScrollToBottom={this.handleMenuScrollToBottom}
          value={value}
          disabled={formProcessing}
          options={options}
          isMulti={hasMany}
        />
      </div>
    );
  }
}

Relationship.defaultProps = {
  style: {},
  required: false,
  errorMessage: defaultError,
  hasMany: false,
  width: 100,
  showError: false,
  value: null,
  formProcessing: false,
};

Relationship.propTypes = {
  relationTo: PropTypes.oneOfType([
    PropTypes.oneOf(Object.keys(collections).map((key) => {
      return collections[key].slug;
    })),
    PropTypes.arrayOf(
      PropTypes.oneOf(Object.keys(collections).map((key) => {
        return collections[key].slug;
      })),
    ),
  ]).isRequired,
  required: PropTypes.bool,
  style: PropTypes.shape({}),
  errorMessage: PropTypes.string,
  showError: PropTypes.bool,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  formProcessing: PropTypes.bool,
  width: PropTypes.number,
  hasMany: PropTypes.bool,
  onFieldChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
    PropTypes.shape({}),
  ]),
};

const RelationshipFieldType = (props) => {
  const fieldType = useFieldType({
    ...props,
  });

  return (
    <Relationship
      {...props}
      {...fieldType}
    />
  );
};

RelationshipFieldType.defaultProps = {
  validate: defaultValidate,
};

RelationshipFieldType.propTypes = {
  validate: PropTypes.func,
};

export default RelationshipFieldType;
