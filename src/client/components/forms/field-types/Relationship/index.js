import React, { Component, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
import some from 'async-some';
import config from 'payload/config';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { relationship } from '../../../../../fields/validations';

import './index.scss';

const cookies = new Cookies();

const {
  cookiePrefix, serverURL, routes: { api }, collections,
} = config;

const cookieTokenName = `${cookiePrefix}-token`;

const maxResultsPerRequest = 10;

class Relationship extends Component {
  constructor(props) {
    super(props);

    const { relationTo, hasMultipleRelations } = this.props;
    const relations = hasMultipleRelations ? relationTo : [relationTo];

    this.state = {
      relations,
      lastFullyLoadedRelation: -1,
      lastLoadedPage: 1,
      options: [],
    };
  }

  componentDidMount() {
    this.getNextOptions();
  }

  getNextOptions = () => {
    const { relations, lastFullyLoadedRelation, lastLoadedPage } = this.state;
    const token = cookies.get(cookieTokenName);

    const relationsToSearch = relations.slice(lastFullyLoadedRelation + 1);

    if (relationsToSearch.length > 0) {
      some(relationsToSearch, async (relation, callback) => {
        const response = await fetch(`${serverURL}${api}/${relation}?limit=${maxResultsPerRequest}&page=${lastLoadedPage}`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        });

        const data = await response.json();

        if (data.hasNextPage) {
          return callback(false, {
            data,
            relation,
          });
        }

        return callback({ relation, data });
      }, (lastPage, nextPage) => {
        if (nextPage) {
          const { data, relation } = nextPage;
          this.addOptions(data, relation);
        } else {
          const { data, relation } = lastPage;
          this.addOptions(data, relation);
          this.setState({
            lastFullyLoadedRelation: relations.indexOf(relation),
            lastLoadedPage: 1,
          });
        }
      });
    }
  }

  // This is needed to reduce the selected option to only its value
  // Essentially, remove the label
  formatSelectedValue = (selectedValue) => {
    const { hasMany } = this.props;

    if (hasMany && Array.isArray(selectedValue)) {
      return selectedValue.map(val => val.value);
    }

    return selectedValue ? selectedValue.value : selectedValue;
  }

  // When ReactSelect prepopulates a selected option,
  // if there are multiple relations, we need to find a nested option to match from
  findValueInOptions = (options, value) => {
    const { hasMultipleRelations, hasMany } = this.props;

    let foundValue = false;

    if (hasMultipleRelations) {
      options.forEach((option) => {
        const potentialValue = option.options.find((subOption) => {
          if (subOption.value && subOption.value.value && value && value.value) {
            return subOption.value.value === value.value;
          }

          return false;
        });

        if (potentialValue) foundValue = potentialValue;
      });
    } else if (value) {
      if (hasMany) {
        foundValue = value.map(val => options.find(option => option.value === val));
      } else {
        foundValue = options.find(option => option.value === value);
      }
    }

    return foundValue || null;
  }

  addOptions = (data, relation) => {
    const { hasMultipleRelations } = this.props;
    const { lastLoadedPage, options } = this.state;
    const collection = collections.find(coll => coll.slug === relation);

    if (!hasMultipleRelations) {
      this.setState({
        options: [
          ...options,
          ...data.docs.map(doc => ({
            label: doc[collection.useAsTitle || 'id'],
            value: doc.id,
          })),
        ],
      });
    } else {
      const allOptionGroups = [...options];
      const optionsToAddTo = allOptionGroups.find(optionGroup => optionGroup.label === collection.labels.plural);

      const newOptions = data.docs.map((doc) => {
        return {
          label: doc[collection.useAsTitle || doc.id],
          value: {
            relationTo: collection.slug,
            value: doc.id,
          },
        };
      });

      if (optionsToAddTo) {
        optionsToAddTo.options = [
          ...optionsToAddTo.options,
          ...newOptions,
        ];
      } else {
        allOptionGroups.push({
          label: collection.labels.plural,
          options: newOptions,
        });
      }

      this.setState({
        options: [
          ...allOptionGroups,
        ],
      });
    }

    this.setState({
      lastLoadedPage: lastLoadedPage + 1,
    });
  }

  handleInputChange = () => {
    // this.setState({
    //   search,
    // });
  }

  handleMenuScrollToBottom = () => {
    this.getNextOptions();
  }

  render() {
    const { options } = this.state;

    const {
      path,
      required,
      style,
      width,
      errorMessage,
      label,
      hasMany,
      value,
      showError,
      formProcessing,
      setValue,
      readOnly,
    } = this.props;

    const classes = [
      'field-type',
      'relationship',
      showError && 'error',
      readOnly && 'read-only',
    ].filter(Boolean).join(' ');

    const valueToRender = this.findValueInOptions(options, value);

    // ///////////////////////////////////////////
    // TODO: simplify formatValue pattern seen below with react select
    // ///////////////////////////////////////////

    return (
      <div
        className={classes}
        style={{
          ...style,
          width,
        }}
      >
        <Error
          showError={showError}
          message={errorMessage}
        />
        <Label
          htmlFor={path}
          label={label}
          required={required}
        />
        <ReactSelect
          onInputChange={this.handleInputChange}
          onChange={(readOnly || formProcessing) ? setValue : undefined}
          formatValue={this.formatSelectedValue}
          onMenuScrollToBottom={this.handleMenuScrollToBottom}
          findValueInOptions={this.findValueInOptions}
          value={valueToRender}
          showError={showError}
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
  errorMessage: '',
  hasMany: false,
  width: undefined,
  showError: false,
  value: null,
  path: '',
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
  path: PropTypes.string,
  formProcessing: PropTypes.bool,
  width: PropTypes.string,
  hasMany: PropTypes.bool,
  setValue: PropTypes.func.isRequired,
  hasMultipleRelations: PropTypes.bool.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({}),
  ]),
};

const RelationshipFieldType = (props) => {
  const [formattedInitialData, setFormattedInitialData] = useState(null);

  const {
    defaultValue, relationTo, hasMany, validate, path, name, initialData,
  } = props;

  const hasMultipleRelations = Array.isArray(relationTo);
  const dataToInitialize = initialData || defaultValue;

  const fieldType = useFieldType({
    ...props,
    path: path || name,
    initialData: formattedInitialData,
    defaultValue,
    validate,
  });

  useEffect(() => {
    const formatInitialData = (valueToFormat) => {
      if (hasMultipleRelations) {
        return {
          ...valueToFormat,
          value: valueToFormat.value.id,
        };
      }

      return valueToFormat.id;
    };

    if (dataToInitialize) {
      if (hasMany && Array.isArray(dataToInitialize)) {
        const newFormattedInitialData = [];

        dataToInitialize.forEach((individualValue) => {
          newFormattedInitialData.push(formatInitialData(individualValue));
        });

        setFormattedInitialData(newFormattedInitialData);
      } else {
        setFormattedInitialData(formatInitialData(dataToInitialize));
      }
    }
  }, [dataToInitialize, hasMany, hasMultipleRelations]);

  return (
    <Relationship
      {...props}
      {...fieldType}
      hasMultipleRelations={hasMultipleRelations}
    />
  );
};

RelationshipFieldType.defaultProps = {
  initialData: undefined,
  defaultValue: undefined,
  validate: relationship,
  path: '',
  hasMany: false,
};

RelationshipFieldType.propTypes = {
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({}),
  ]),
  initialData: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({
      relationTo: PropTypes.string,
      value: PropTypes.string,
    }),
  ]),
  relationTo: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(
      PropTypes.string,
    ),
  ]).isRequired,
  hasMany: PropTypes.bool,
  validate: PropTypes.func,
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
};

export default withCondition(RelationshipFieldType);
