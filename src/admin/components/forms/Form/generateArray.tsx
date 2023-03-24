import { useWatchForm } from "./context";
import { Fields, Field } from "./types";

// function to generate arrays
export const generateArray = (obj: Fields | Field, property: any, arr: any)  => {

  for (const val in obj as Field) {
    if (obj[val] instanceof Array || obj[val] instanceof Object) {
      generateArray(obj[val], property, arr);
    };

    // find the key that match 'initialValue' and 'value' (property). Here, only field values will be pushed to the array. For example, when we type in a rich text field for the first time, this action will create an array of children object(s) with the 'current' value(s), but if we backspace or remove what we typed the array of children will remain within getFields() object, so it will always be different to the values in the initialValue array as at this point there is no array of children for the rich text editor values (I hope this makes sense), meaning that the button will remain active. Adding only the field values to both arrays makes it easier an more accurate to compare. There might be other ways to compare, perhaps through querying the api?
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
};