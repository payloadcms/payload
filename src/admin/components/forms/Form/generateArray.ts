// function to generate arrays
const generateArrFromObj = (obj: any, arr: any) => {
  for (const val in obj as any) {
    if (obj[val] instanceof Array || obj[val] instanceof Object) {
      generateArrFromObj(obj[val], arr);
    } else {
      // checkboxes are undefined by default when they are untick, so we need to pass them as false when creating the array
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
export const generateStrFromObj = (obj: any) => {
  //arrays to store states values
  let arr = [];

  // generate arrays using the generate array function
  generateArrFromObj(obj, arr);

  // reduce each array into a single string
  let arrJoin = arr.join("").trim();

  return arrJoin;
};
