import React, {
  Component, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import some from 'async-some';
import config from 'payload/config';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { relationship } from '../../../../../fields/validations';

import './index.scss';

const {
  serverURL, routes: { api }, collections,
} = config;

const maxResultsPerRequest = 10;

const baseClass = 'relationship';

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
      errorLoading: false,
      loadedIDs: [],
    };
  }

  componentDidMount() {
    this.getNextOptions();
  }

  componentDidUpdate(_, prevState) {
    const { search, options } = this.state;
    if (search !== prevState.search) {
      this.getNextOptions({ clear: true });
    }

    if (options !== prevState.options) {
      this.ensureValueHasOption();
    }
  }

  getNextOptions = (params = {}) => {
    const { errorLoading } = this.state;
    const { clear } = params;

    if (clear) {
      this.setState({
        options: [],
        loadedIDs: [],
        lastFullyLoadedRelation: -1,
      });
    }

    if (!errorLoading) {
      const {
        relations, lastFullyLoadedRelation, lastLoadedPage, search,
      } = this.state;

      const relationsToSearch = lastFullyLoadedRelation === -1 ? relations : relations.slice(lastFullyLoadedRelation + 1);

      if (relationsToSearch.length > 0) {
        some(relationsToSearch, async (relation, callback) => {
          const collection = collections.find((coll) => coll.slug === relation);
          const fieldToSearch = collection?.admin?.useAsTitle || 'id';
          const searchParam = search ? `&where[${fieldToSearch}][like]=${search}` : '';
          const response = await fetch(`${serverURL}${api}/${relation}?limit=${maxResultsPerRequest}&page=${lastLoadedPage}${searchParam}`);
          const data = await response.json();

          if (response.ok) {
            if (data.hasNextPage) {
              return callback(false, {
                data,
                relation,
              });
            }

            return callback({ relation, data });
          }

          let error = 'There was a problem loading options for this field.';

          if (response.status === 403) {
            error = 'You do not have permission to load options for this field.';
          }

          return this.setState({
            errorLoading: error,
          });
        }, (lastPage, nextPage) => {
          if (nextPage) {
            const { data, relation } = nextPage;
            this.addOptions(data, relation);
            this.setState({
              lastLoadedPage: lastLoadedPage + 1,
            });
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
  }

  // This is needed to reduce the selected option to only its value
  // Essentially, remove the label
  formatSelectedValue = (selectedValue) => {
    const { hasMany } = this.props;

    if (hasMany && Array.isArray(selectedValue)) {
      return selectedValue.map((val) => val.value);
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
          if (subOption?.value?.value && value?.value) {
            return subOption.value.value === value.value;
          }

          return false;
        });

        if (potentialValue) foundValue = potentialValue;
      });
    } else if (value) {
      if (hasMany) {
        foundValue = value.map((val) => options.find((option) => option.value === val));
      } else {
        foundValue = options.find((option) => option.value === value);
      }
    }

    return foundValue || undefined;
  }

  addOptions = (data, relation) => {
    const { hasMultipleRelations } = this.props;
    const { options, loadedIDs } = this.state;
    const collection = collections.find((coll) => coll.slug === relation);

    const newlyLoadedIDs = [];

    let newOptions = [];

    if (!hasMultipleRelations) {
      newOptions = [
        ...options,
        ...data.docs.reduce((docs, doc) => {
          if (loadedIDs.indexOf(doc.id) === -1) {
            newlyLoadedIDs.push(doc.id);

            return [
              ...docs,
              {
                label: doc[collection?.admin?.useAsTitle || 'id'],
                value: doc.id,
              },
            ];
          }
          return docs;
        }, []),
      ];
    } else {
      newOptions = [...options];
      const optionsToAddTo = newOptions.find((optionGroup) => optionGroup.label === collection.labels.plural);

      const newSubOptions = data.docs.reduce((docs, doc) => {
        if (loadedIDs.indexOf(doc.id) === -1) {
          newlyLoadedIDs.push(doc.id);

          return [
            ...docs,
            {
              label: doc[collection?.admin?.useAsTitle || 'id'],
              value: {
                relationTo: collection.slug,
                value: doc.id,
              },
            },
          ];
        }

        return docs;
      }, []);

      if (optionsToAddTo) {
        optionsToAddTo.options = [
          ...optionsToAddTo.options,
          ...newSubOptions,
        ];
      } else {
        newOptions.push({
          label: collection.labels.plural,
          options: newSubOptions,
        });
      }
    }

    this.setState({
      options: newOptions,
      loadedIDs: [
        ...loadedIDs,
        ...newlyLoadedIDs,
      ],
    });
  }

  ensureValueHasOption = async () => {
    const { relationTo, hasMany, value } = this.props;
    const { options } = this.state;
    const locatedValue = this.findValueInOptions(options, value);

    const hasMultipleRelations = Array.isArray(relationTo);

    if (!locatedValue && value) {
      if (hasMany) {
        value.forEach((val) => {
          if (hasMultipleRelations) {
            this.addOptionByID(val.value, val.relationTo);
          } else {
            this.addOptionByID(val, relationTo);
          }
        });
      } else if (hasMultipleRelations) {
        this.addOptionByID(value.value, value.relationTo);
      } else {
        this.addOptionByID(value, relationTo);
      }
    }
  }

  addOptionByID = async (id, relation) => {
    const response = await fetch(`${serverURL}${api}/${relation}/${id}`);
    const data = await response.json();
    this.addOptions({ docs: [data] }, relation);
  }

  handleInputChange = (search) => {
    const { search: existingSearch } = this.state;

    if (search !== existingSearch) {
      this.setState({
        search,
        lastFullyLoadedRelation: -1,
        lastLoadedPage: 1,
      });
    }
  }

  handleMenuScrollToBottom = () => {
    this.getNextOptions();
  }

  render() {
    const { options, errorLoading } = this.state;

    const {
      path,
      required,
      errorMessage,
      label,
      hasMany,
      value,
      showError,
      formProcessing,
      setValue,
      admin: {
        readOnly,
        style,
        width,
      } = {},
    } = this.props;

    const classes = [
      'field-type',
      baseClass,
      showError && 'error',
      errorLoading && 'error-loading',
      readOnly && `${baseClass}--read-only`,
    ].filter(Boolean).join(' ');

    const valueToRender = this.findValueInOptions(options, value) || value;

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
        {!errorLoading && (
          <ReactSelect
            isDisabled={readOnly}
            onInputChange={this.handleInputChange}
            onChange={!readOnly ? setValue : undefined}
            formatValue={this.formatSelectedValue}
            onMenuScrollToBottom={this.handleMenuScrollToBottom}
            findValueInOptions={this.findValueInOptions}
            value={valueToRender}
            showError={showError}
            disabled={formProcessing}
            options={options}
            isMulti={hasMany}
          />
        )}
        {errorLoading && (
          <div className={`${baseClass}__error-loading`}>
            {errorLoading}
          </div>
        )}
      </div>
    );
  }
}

Relationship.defaultProps = {
  required: false,
  errorMessage: '',
  hasMany: false,
  showError: false,
  value: undefined,
  path: '',
  formProcessing: false,
  admin: {},
};

Relationship.propTypes = {
  relationTo: PropTypes.oneOfType([
    PropTypes.oneOf(Object.keys(collections).map((key) => collections[key].slug)),
    PropTypes.arrayOf(
      PropTypes.oneOf(Object.keys(collections).map((key) => collections[key].slug)),
    ),
  ]).isRequired,
  required: PropTypes.bool,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
  errorMessage: PropTypes.string,
  showError: PropTypes.bool,
  label: PropTypes.string.isRequired,
  path: PropTypes.string,
  formProcessing: PropTypes.bool,
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
  const {
    relationTo, validate, path, name, required,
  } = props;

  const hasMultipleRelations = Array.isArray(relationTo);

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);


  const fieldType = useFieldType({
    ...props,
    path: path || name,
    validate: memoizedValidate,
    required,
  });

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
  required: false,
};

RelationshipFieldType.propTypes = {
  required: PropTypes.bool,
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({}),
  ]),
  initialData: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({}),
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
