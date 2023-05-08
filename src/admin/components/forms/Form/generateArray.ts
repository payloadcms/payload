import { Fields, Field } from "./types";

// function to generate arrays
const generateArrFromObj = (obj: Fields | Field, arr: any) => {
  for (const val in obj as Field) {
    if (obj[val] instanceof Array || obj[val] instanceof Object) {
      generateArrFromObj(obj[val], arr);
    } else {
      if (val === "checkbox") {
        if (obj[val] === undefined) obj[val] = false;
        arr.push(obj[val]);
      } else {
        arr.push(obj[val]);
      }
    }
  }
};

// function to compare states
export const createArray = (obj: Fields | Field, arr: any) => {
  //arrays to store states values
  arr = [];

  // generate arrays using the generate array function
  generateArrFromObj(obj, arr);

  //console.log(arr);
  //console.log(arr);

  // reduce each array into a single string
  let arrJoin = arr.join("").trim();
  //console.log(`arr: ${arrJoin}`);

  return arrJoin;
};
