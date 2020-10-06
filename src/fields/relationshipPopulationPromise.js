const relationshipPopulationPromise = ({
  data,
  field,
  populate,
}) => async () => {
  const resultingData = data;

  if (field.hasMany && Array.isArray(data[field.name])) {
    const rowPromises = [];

    data[field.name].forEach((relatedDoc, index) => {
      const rowPromise = async () => {
        if (relatedDoc) {
          await populate(
            relatedDoc,
            resultingData,
            field,
            index,
          );
        }
      };

      rowPromises.push(rowPromise());
    });

    await Promise.all(rowPromises);
  } else if (data[field.name]) {
    await populate(
      data[field.name],
      resultingData,
      field,
    );
  }
};

module.exports = relationshipPopulationPromise;
