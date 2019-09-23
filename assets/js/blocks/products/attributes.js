/**
 * Internal dependencies
 */
import { DEFAULT_COLUMNS, DEFAULT_ROWS } from '@woocommerce/block-settings';

export default {
	/**
	 * Number of columns.
	 */
	columns: {
		type: 'number',
		default: DEFAULT_COLUMNS,
	},

	/**
	 * Number of rows.
	 */
	rows: {
		type: 'number',
		default: DEFAULT_ROWS,
	},

	/**
	 * How to align cart buttons.
	 */
	alignButtons: {
		type: 'boolean',
		default: false,
	},

	/**
	 * Content visibility setting
	 */
	contentVisibility: {
		type: 'object',
		default: {
			image: true,
			title: true,
			rating: true,
			price: true,
			button: true,
		},
	},

	/**
	 * Order to use for the products listing.
	 */
	orderby: {
		type: 'string',
		default: 'date',
	},

	/**
	 * Show the order by selector.
	 */
	showOrderby: {
		type: 'boolean',
		default: true,
	},
};
