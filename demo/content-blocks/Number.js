module.exports = {
	slug: 'number',
	labels: {
		singular: 'Number',
		plural: 'Numbers',
	},
	fields: [
		{
			name: 'testNumber',
			label: 'Test Number Field',
			type: 'number',
			maxLength: 100,
			required: true,
		},
	],
};
