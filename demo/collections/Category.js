const checkRole = require('../policies/checkRole');

module.exports = {
	slug: 'categories',
	labels: {
		singular: 'Category',
		plural: 'Categories',
	},
	useAsTitle: 'title',
	policies: {
		create: user => checkRole(['user', 'admin'], user),
		read: () => true,
		update: user => checkRole(['user', 'admin'], user),
		destroy: user => checkRole(['user', 'admin'], user),
	},
	fields: [
		{
			name: 'title',
			label: 'Title',
			type: 'text',
			maxLength: 100,
			required: true,
			unique: true,
			localized: true,
		},
		{
			name: 'description',
			label: 'Description',
			type: 'textarea',
			height: 100,
			required: true,
			localized: true,
		},
		{
			name: 'post',
			label: 'Post',
			type: 'relationship',
			relationTo: ['posts', 'categories'],
			localized: false,
			hasMany: false,
		},
		{
			name: 'demoSelect',
			label: 'Demo Select',
			type: 'select',
			options: [{
				value: 'Option 1',
				label: 'Here is a label for Option 1',
			}, {
				value: 'Option 2',
				label: 'Option 2 Label',
			}, {
				value: 'Option 3',
				label: 'Option 3 Label',
			}, {
				value: 'Option 4',
				label: 'Option 4 Label',
			}],
			defaultValue: 'Option 1',
			required: true,
		},
		{
			name: 'demoSelectMany',
			label: 'Demo Select w/ hasMany',
			type: 'select',
			options: [{
				value: 'Option 1',
				label: 'Here is a label for Option 1',
			}, {
				value: 'Option 2',
				label: 'Option 2 Label',
			}, {
				value: 'Option 3',
				label: 'Option 3 Label',
			}, {
				value: 'Option 4',
				label: 'Option 4 Label',
			}],
			defaultValue: 'Option 1',
			required: true,
			hasMany: true,
		},
	],
	timestamps: true,
};
