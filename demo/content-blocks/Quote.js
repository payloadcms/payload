module.exports = {
	slug: 'quote',
	labels: {
		singular: 'Quote',
		plural: 'Quotes',
	},
	fields: [
		{
			name: 'author',
			label: 'Author',
			type: 'text',
			maxLength: 100,
			required: true,
		},
		{
			name: 'quote',
			label: 'Quote',
			type: 'textarea',
			height: 100,
			required: true,
		},
		{
			name: 'color',
			label: 'Color',
			type: 'text',
			maxLength: 7,
			required: true,
		},
	],
};
