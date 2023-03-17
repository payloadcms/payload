import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import FormSubmit from '../../forms/Submit';
import { useForm, useFormModified, useWatchForm } from '../../forms/Form/context';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useLocale } from '../../utilities/Locale';
import { Field, Fields } from '../../forms/Form/types';

import './index.scss';

const baseClass = 'save-draft';

const SaveDraft: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig();
  const { submit } = useForm();
  const { collection, global, id } = useDocumentInfo();
  const modified = useFormModified();
  const locale = useLocale();
  const { t } = useTranslation('version');
  const { getFields } = useWatchForm();

  
  const canSaveDraft = modified;

  let canSave = false;
  
  
  // testing 4
  
  //ARRAYS TO STORE STATES
  let initialValuesArr = [];
  let currentValuesArr = [];


  // FUNCTION TO GENERATE STATE ARRAYS
  const stateArrays = (obj: Fields | Field, property: string, arr: any)  => {
    
    var reRun = null;

    if (obj instanceof Array) {
      for (var i = 0; i < Object.keys(obj).length; i++) {
        reRun = stateArrays(obj[i], property, arr);
        if (reRun) {
          break;
        }
      }
    }
    else {
      for (var val in obj as Field) {
        if (obj[val] instanceof Array || obj[val] instanceof Object) {
          reRun = stateArrays(obj[val], property, arr);
          if (reRun) {
            break;
          };
        };

        if (obj[property]) {
          if (obj[property] !== undefined || obj[property] !== '') {
            arr.push(obj[property]);
            break;
          }
        };
      };
    };
    return reRun;
  }

  // FUNCTION TO ALTER ARRAY - FIND UNIQUE KEYS LIKE 'text' WHEN NESTED ARRAYS

  const findUniqueValues = (arr: any, property: string) => {
    var reRun = null;

    if (arr instanceof Array) {
      for (var i = 0; i < arr.length; i++) {
        reRun = findUniqueValues(arr, property);
        if (reRun) {
          break;
        }
      }
    }
    else {
      for (var val in arr as Field) {
        if (arr[val] instanceof Array || arr[val] instanceof Object) {
          reRun = findUniqueValues(arr, property);
          if (reRun) {
            break;
          };
        };



      if (arr instanceof Array) {
        for (var i = 0; i < arr.length; i++) {
          reRun = findUniqueValues(arr, property);
          if (reRun) {
            break;
          }
        }
      }

      for (var val in arr as Field) {
        if (arr[val] instanceof Array || arr[val] instanceof Object) {
          reRun = findUniqueValues(arr, property);
          if (reRun) {
            break;
          };
        };

        if (arr[property]) {
          if (arr[property] !== undefined || arr[property] !== '') {
            arr.push(arr[property]);
            break;
          }
        };
      };
      };
    };
    return reRun;
  }

  // GENERATE STATE ARRAYS
  stateArrays(getFields(), 'initialValue', initialValuesArr);
  stateArrays(getFields(), 'value', currentValuesArr);

  // find nested unique values
  findUniqueValues(currentValuesArr, 'text');


  console.log(initialValuesArr);
  console.log(currentValuesArr);

  // INITTIAL STATE CHECKER
  // const initialStateChecker = (obj: Fields | Field)  => {
    
  //   var reRun = null;

  //   if (obj instanceof Array) {
  //     for (var i = 0; i < Object.keys(obj).length; i++) {
  //       reRun = initialStateChecker(obj[i]);
  //       if (reRun) {
  //         break;
  //       }
  //     }
  //   }
  //   else {
  //     for (var val in obj as Field) {
  //       if (obj[val] instanceof Array || obj[val] instanceof Object) {
  //         reRun = initialStateChecker(obj[val]);
  //         if (reRun) {
  //           break;
  //         };
  //       };

  //       if (obj.initialValue) {
  //         if (obj.initialValue !== undefined || obj.initialValue !== '') {
  //           initialValuesArr.push(obj.initialValue);
  //           break;
  //         }
  //       };
  //     };
  //   };
  //   return reRun;
  // }
  // initialStateChecker(getFields());

  // SHAPING CURRENT ARRAY

  
  
  if (JSON.stringify(initialValuesArr) === JSON.stringify(currentValuesArr)) {
    //console.log(`state hasn't changed`)
    canSave = true;
  }
  else {
    //console.log(`state has changed`)
    canSave = false;
  }
  // //console.log(getFields())



  // end of testing 4





  // test 5


  // end of test 5






  console.log(canSaveDraft);

  const saveDraft = useCallback(() => {
    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`;
    let action;
    let method = 'POST';

    if (collection) {
      action = `${serverURL}${api}/${collection.slug}${id ? `/${id}` : ''}${search}`;
      if (id) method = 'PATCH';
    }

    if (global) {
      action = `${serverURL}${api}/globals/${global.slug}${search}`;
    }

    submit({
      action,
      method,
      skipValidation: true,
      overrides: {
        _status: 'draft',
      },
    });
  }, [submit, collection, global, serverURL, api, locale, id]);

  return (
    <FormSubmit
      className={baseClass}
      type="button"
      buttonStyle="secondary"
      onClick={saveDraft}
      disabled={canSave}
    >
      {t('saveDraft')}
    </FormSubmit>
  );
};

export default SaveDraft;
