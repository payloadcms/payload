const checkRole = require('../policies/checkRole');

module.exports = {
	slug: 'footer',
	label: 'Footer',
	policies: {
		create: user => checkRole(['admin', 'user'], user),
		read: () => true,
		update: user => checkRole(['admin', 'user'], user),
		destroy: user => checkRole(['admin', 'user'], user),
	},
	fields: [
		{
			name: 'copyright',
			label: 'Copyright',
			type: 'text',
			localized: true,
		},
	],
};
