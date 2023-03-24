import { Fields, Field } from "./types";

//FUNCTION TO GENERATE STATE ARRAYS
const generateArrays = (obj: Fields | Field, property: any, arr: any)  => {

  // let reRun = null;

  for (const val in obj as Field) {
    if (obj[val] instanceof Array || obj[val] instanceof Object) {
      generateArrays(obj[val], property, arr);
      //break;
      // reRun = generateArrays(obj[val], property, arr);
      // if (reRun) {
      //   break;
      // };
    };

    // find the key that match 'initialValue' and 'value' (property). Here, only field values will be pushed to the array. For example, when we type in a rich text field for the first time, this action will create an array of children object(s) with the 'current' value(s), but if we backspace or remove what we typed the array will remain within getFields() object, so it will always be different to the values in the initialValue array, meaning that the button will remain active. Adding only the field values to both arrays makes it easier an more accurate to compare. There might be other ways, perhaps through querying the api?.
    if (obj[property]) {
      if (obj[property] !== undefined) {
        if (val === property) {
          if (obj[property] instanceof Array) {
            for (let i = 0; i < obj[property].length; i++) {
              for (let y = 0; y < obj[property].length; y++) {
                arr.push(obj[property][y].children[0].text);
              }
              break;
            }
            break;
          }
          else {
            arr.push(obj[property]);
          }
        }
      }
    };
  };
}

// main function to be exported
export const publishButton = (obj: Fields | Field) => {

  //arrays to store states values
  let initialValuesArr = [];
  let currentValuesArr = [];


  // function to generate arrays
  generateArrays(obj, 'initialValue', initialValuesArr);
  generateArrays(obj, 'value', currentValuesArr);

  // reduce each array into a single string
  let initialValuesArrJoin = initialValuesArr.join("").trim();
  console.log(initialValuesArrJoin);
  let currentValuesArrJoin = currentValuesArr.join("").trim();
  console.log(currentValuesArrJoin);

  // compare the two strings
  if (initialValuesArrJoin === 'draft' && currentValuesArrJoin === 'draft') {
    // console.log(`state hasn't changed`)
    return false;
  }
  else  {
    // console.log(`state has changed`)
    return true;
  }

};

// code by eustachio