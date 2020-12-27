const withRelationship = (incomingEditor) => {
  const editor = incomingEditor;
  const { isVoid } = editor;

  editor.isVoid = (element) => (element.type === 'relationship' ? true : isVoid(element));

  return editor;
};

export default withRelationship;
