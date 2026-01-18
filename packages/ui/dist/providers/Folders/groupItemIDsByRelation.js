export function groupItemIDsByRelation(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.relationTo]) {
      acc[item.relationTo] = [];
    }
    acc[item.relationTo].push(item.value.id);
    return acc;
  }, {});
}
//# sourceMappingURL=groupItemIDsByRelation.js.map