/**
 * External dependencies
 */
const path = require( 'path' );
const MergeExtractFilesPlugin = require( './merge-extract-files-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const ProgressBarPlugin = require( 'progress-bar-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const { NormalModuleReplacementPlugin } = require( 'webpack' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const chalk = require( 'chalk' );
const { omit } = require( 'lodash' );
const NODE_ENV = process.env.NODE_ENV || 'development';

const dashIconReplacementModule = path.resolve(
	__dirname,
	'../assets/js/module_replacements/dashicon.js'
);

function findModuleMatch( module, match ) {
	if ( module.request && match.test( module.request ) ) {
		return true;
	} else if ( module.issuer ) {
		return findModuleMatch( module.issuer, match );
	}
	return false;
}

const requestToExternal = ( request ) => {
	const wcDepMap = {
		'@woocommerce/blocks-registry': [ 'wc', 'wcBlocksRegistry' ],
		'@woocommerce/settings': [ 'wc', 'wcSettings' ],
		'@woocommerce/block-data': [ 'wc', 'wcBlocksData' ],
		'@woocommerce/shared-context': [ 'wc', 'wcSharedContext' ],
	};
	if ( wcDepMap[ request ] ) {
		return wcDepMap[ request ];
	}
};

const requestToHandle = ( request ) => {
	const wcHandleMap = {
		'@woocommerce/blocks-registry': 'wc-blocks-registry',
		'@woocommerce/settings': 'wc-settings',
		'@woocommerce/block-settings': 'wc-settings',
		'@woocommerce/block-data': 'wc-blocks-data-store',
		'@woocommerce/shared-context': 'wc-shared-context',
	};
	if ( wcHandleMap[ request ] ) {
		return wcHandleMap[ request ];
	}
};

const getAlias = ( options = {} ) => {
	let { pathPart } = options;
	pathPart = pathPart ? `${ pathPart }/` : '';
	return {
		'@woocommerce/atomic-blocks': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }atomic/blocks`
		),
		'@woocommerce/atomic-utils': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }atomic/utils`
		),
		'@woocommerce/base-components': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }base/components/`
		),
		'@woocommerce/base-context': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }base/context/`
		),
		'@woocommerce/base-hocs': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }base/hocs/`
		),
		'@woocommerce/base-hooks': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }base/hooks/`
		),
		'@woocommerce/base-utils': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }base/utils/`
		),
		'@woocommerce/block-components': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }components/`
		),
		'@woocommerce/block-hocs': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }hocs`
		),
		'@woocommerce/blocks-registry': path.resolve(
			__dirname,
			'../assets/js/blocks-registry'
		),
		'@woocommerce/block-settings': path.resolve(
			__dirname,
			'../assets/js/settings/blocks'
		),
		'@woocommerce/icons': path.resolve( __dirname, `../assets/js/icons` ),
		'@woocommerce/resource-previews': path.resolve(
			__dirname,
			`../assets/js/${ pathPart }previews/`
		),
		'@woocommerce/e2e-tests': path.resolve(
			__dirname,
			'node_modules/woocommerce/tests/e2e-tests'
		),
	};
};

const stableMainEntry = {
	// Shared blocks code
	blocks: './assets/js/index.js',

	// @wordpress/components styles
	'custom-select-control-style':
		'./node_modules/wordpress-components/src/custom-select-control/style.scss',
	'spinner-style':
		'./node_modules/wordpress-components/src/spinner/style.scss',
	'snackbar-notice-style':
		'./node_modules/wordpress-components/src/snackbar/style.scss',

	// Styles for grid blocks. WP <=5.2 doesn't have the All Products block,
	// so this file would not be included if not explicitly declared here.
	// This file is excluded from the default build so CSS styles are included
	// in the other the components are imported.
	'product-list-style': './assets/js/base/components/product-list/style.scss',

	// Blocks
	'handpicked-products': './assets/js/blocks/handpicked-products/index.js',
	'product-best-sellers': './assets/js/blocks/product-best-sellers/index.js',
	'product-category': './assets/js/blocks/product-category/index.js',
	'product-categories': './assets/js/blocks/product-categories/index.js',
	'product-new': './assets/js/blocks/product-new/index.js',
	'product-on-sale': './assets/js/blocks/product-on-sale/index.js',
	'product-top-rated': './assets/js/blocks/product-top-rated/index.js',
	'products-by-attribute':
		'./assets/js/blocks/products-by-attribute/index.js',
	'featured-product': './assets/js/blocks/featured-product/index.js',
	'all-reviews': './assets/js/blocks/reviews/all-reviews/index.js',
	'reviews-by-product':
		'./assets/js/blocks/reviews/reviews-by-product/index.js',
	'reviews-by-category':
		'./assets/js/blocks/reviews/reviews-by-category/index.js',
	'product-search': './assets/js/blocks/product-search/index.js',
	'product-tag': './assets/js/blocks/product-tag/index.js',
	'featured-category': './assets/js/blocks/featured-category/index.js',
	'all-products': './assets/js/blocks/products/all-products/index.js',
	'price-filter': './assets/js/blocks/price-filter/index.js',
	'attribute-filter': './assets/js/blocks/attribute-filter/index.js',
	'active-filters': './assets/js/blocks/active-filters/index.js',
	'block-error-boundary':
		'./assets/js/base/components/block-error-boundary/style.scss',
	cart: './assets/js/blocks/cart-checkout/cart/index.js',
	checkout: './assets/js/blocks/cart-checkout/checkout/index.js',
};

const experimentalMainEntry = {
	'single-product': './assets/js/blocks/single-product/index.js',
};

const mainEntry =
	// env variables are strings, so we compare against a string, so we need to parse it.
	parseInt( process.env.WOOCOMMERCE_BLOCKS_PHASE, 10 ) < 3
		? stableMainEntry
		: { ...stableMainEntry, ...experimentalMainEntry };

const stableFrontEndEntry = {
	reviews: './assets/js/blocks/reviews/frontend.js',
	'all-products': './assets/js/blocks/products/all-products/frontend.js',
	'price-filter': './assets/js/blocks/price-filter/frontend.js',
	'attribute-filter': './assets/js/blocks/attribute-filter/frontend.js',
	'active-filters': './assets/js/blocks/active-filters/frontend.js',
	cart: './assets/js/blocks/cart-checkout/cart/frontend.js',
	checkout: './assets/js/blocks/cart-checkout/checkout/frontend.js',
};

const experimentalFrontEndEntry = {
	'single-product': './assets/js/blocks/single-product/frontend.js',
};

const frontEndEntry =
	// env variables are strings, so we compare against a string, so we need to parse it.
	parseInt( process.env.WOOCOMMERCE_BLOCKS_PHASE, 10 ) < 3
		? stableFrontEndEntry
		: { ...stableFrontEndEntry, ...experimentalFrontEndEntry };

const getEntryConfig = ( main = true, exclude = [] ) => {
	const entryConfig = main ? mainEntry : frontEndEntry;
	return omit( entryConfig, exclude );
};

const getMainConfig = ( options = {} ) => {
	let { fileSuffix } = options;
	const { alias, resolvePlugins = [] } = options;
	fileSuffix = fileSuffix ? `-${ fileSuffix }` : '';
	const resolve = alias
		? {
				alias,
				plugins: resolvePlugins,
		  }
		: {
				plugins: resolvePlugins,
		  };
	return {
		entry: getEntryConfig( true, options.exclude || [] ),
		output: {
			devtoolNamespace: 'wc',
			path: path.resolve( __dirname, '../build/' ),
			filename: `[name]${ fileSuffix }.js`,
			library: [ 'wc', 'blocks', '[name]' ],
			libraryTarget: 'this',
			// This fixes an issue with multiple webpack projects using chunking
			// overwriting each other's chunk loader function.
			// See https://webpack.js.org/configuration/output/#outputjsonpfunction
			jsonpFunction: 'webpackWcBlocksJsonp',
		},
		optimization: {
			splitChunks: {
				minSize: 0,
				cacheGroups: {
					commons: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						chunks: 'all',
						enforce: true,
					},
					editor: {
						// Capture all `editor` stylesheets and the components stylesheets.
						test: ( module = {} ) =>
							module.constructor.name === 'CssModule' &&
							( findModuleMatch( module, /editor\.scss$/ ) ||
								findModuleMatch(
									module,
									/[\\/]assets[\\/]components[\\/]/
								) ),
						name: 'editor',
						chunks: 'all',
						priority: 10,
					},
					'vendors-style': {
						test: /\/node_modules\/.*?style\.s?css$/,
						name: 'vendors-style',
						chunks: 'all',
						priority: 7,
					},
					style: {
						test: /style\.scss$/,
						name: 'style',
						chunks: 'all',
						priority: 5,
					},
				},
			},
		},
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader?cacheDirectory',
						options: {
							presets: [ '@wordpress/babel-preset-default' ],
							plugins: [
								NODE_ENV === 'production'
									? require.resolve(
											'babel-plugin-transform-react-remove-prop-types'
									  )
									: false,
								require.resolve(
									'@babel/plugin-proposal-class-properties'
								),
							].filter( Boolean ),
						},
					},
				},
				{
					test: /\/node_modules\/.*?style\.s?css$/,
					use: [
						MiniCssExtractPlugin.loader,
						{ loader: 'css-loader', options: { importLoaders: 1 } },
						'postcss-loader',
						{
							loader: 'sass-loader',
							query: {
								includePaths: [ 'node_modules' ],
								data: [
									'colors',
									'breakpoints',
									'variables',
									'mixins',
									'animations',
									'z-index',
								]
									.map(
										( imported ) =>
											`@import "~@wordpress/base-styles/${ imported }";`
									)
									.join( ' ' ),
							},
						},
					],
				},
				{
					test: /\.s?css$/,
					exclude: /node_modules/,
					use: [
						MiniCssExtractPlugin.loader,
						{ loader: 'css-loader', options: { importLoaders: 1 } },
						'postcss-loader',
						{
							loader: 'sass-loader',
							query: {
								includePaths: [
									'assets/css/abstracts',
									'node_modules',
								],
								data: [
									'_colors',
									'_variables',
									'_breakpoints',
									'_mixins',
								]
									.map(
										( imported ) =>
											`@import "${ imported }";`
									)
									.join( ' ' ),
							},
						},
					],
				},
			],
		},
		plugins: [
			new WebpackRTLPlugin( {
				filename: `[name]${ fileSuffix }-rtl.css`,
				minify: {
					safe: true,
				},
			} ),
			new MiniCssExtractPlugin( {
				filename: `[name]${ fileSuffix }.css`,
			} ),
			new MergeExtractFilesPlugin(
				[
					`build/editor${ fileSuffix }.js`,
					`build/style${ fileSuffix }.js`,
				],
				`build/vendors${ fileSuffix }.js`
			),
			new ProgressBarPlugin( {
				format:
					chalk.blue( 'Build' ) +
					' [:bar] ' +
					chalk.green( ':percent' ) +
					' :msg (:elapsed seconds)',
			} ),
			new DependencyExtractionWebpackPlugin( {
				injectPolyfill: true,
				requestToExternal,
				requestToHandle,
			} ),
			new NormalModuleReplacementPlugin(
				/dashicon/,
				( result ) => ( result.resource = dashIconReplacementModule )
			),
		],
		resolve,
	};
};

const getFrontConfig = ( options = {} ) => {
	let { fileSuffix } = options;
	const { alias, resolvePlugins = [] } = options;
	fileSuffix = fileSuffix ? `-${ fileSuffix }` : '';
	const resolve = alias
		? {
				alias,
				plugins: resolvePlugins,
		  }
		: {
				plugins: resolvePlugins,
		  };
	return {
		entry: getEntryConfig( false, options.exclude || [] ),
		output: {
			devtoolNamespace: 'wc',
			path: path.resolve( __dirname, '../build/' ),
			filename: `[name]-frontend${ fileSuffix }.js`,
			// This fixes an issue with multiple webpack projects using chunking
			// overwriting each other's chunk loader function.
			// See https://webpack.js.org/configuration/output/#outputjsonpfunction
			jsonpFunction: 'webpackWcBlocksJsonp',
		},
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader?cacheDirectory',
						options: {
							presets: [
								[
									'@babel/preset-env',
									{
										modules: false,
										targets: {
											browsers: [
												'extends @wordpress/browserslist-config',
											],
										},
									},
								],
							],
							plugins: [
								require.resolve(
									'@babel/plugin-proposal-object-rest-spread'
								),
								require.resolve(
									'@babel/plugin-transform-react-jsx'
								),
								require.resolve(
									'@babel/plugin-proposal-async-generator-functions'
								),
								require.resolve(
									'@babel/plugin-transform-runtime'
								),
								require.resolve(
									'@babel/plugin-proposal-class-properties'
								),
								NODE_ENV === 'production'
									? require.resolve(
											'babel-plugin-transform-react-remove-prop-types'
									  )
									: false,
							].filter( Boolean ),
						},
					},
				},
				{
					test: /\.s[c|a]ss$/,
					use: {
						loader: 'ignore-loader',
					},
				},
			],
		},
		plugins: [
			new ProgressBarPlugin( {
				format:
					chalk.blue( 'Build frontend scripts' ) +
					' [:bar] ' +
					chalk.green( ':percent' ) +
					' :msg (:elapsed seconds)',
			} ),
			new DependencyExtractionWebpackPlugin( {
				injectPolyfill: true,
				requestToExternal,
				requestToHandle,
			} ),
			new NormalModuleReplacementPlugin(
				/dashicon/,
				( result ) => ( result.resource = dashIconReplacementModule )
			),
		],
		resolve,
	};
};

const getPaymentMethodsExtensionConfig = ( options = {} ) => {
	const { alias, resolvePlugins = [] } = options;
	const resolve = alias
		? {
				alias,
				plugins: resolvePlugins,
		  }
		: {
				plugins: resolvePlugins,
		  };
	return {
		entry: {
			'wc-payment-method-stripe':
				'./assets/js/payment-method-extensions/payment-methods/stripe/index.js',
			'wc-payment-method-cheque':
				'./assets/js/payment-method-extensions/payment-methods/cheque/index.js',
			'wc-payment-method-paypal':
				'./assets/js/payment-method-extensions/payment-methods/paypal/index.js',
		},
		output: {
			devtoolNamespace: 'wc',
			path: path.resolve( __dirname, '../build/' ),
			filename: `[name].js`,
			// This fixes an issue with multiple webpack projects using chunking
			// overwriting each other's chunk loader function.
			// See https://webpack.js.org/configuration/output/#outputjsonpfunction
			jsonpFunction: 'webpackWcBlocksPaymentMethodExtensionJsonp',
		},
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader?cacheDirectory',
						options: {
							presets: [
								[
									'@babel/preset-env',
									{
										modules: false,
										targets: {
											browsers: [
												'extends @wordpress/browserslist-config',
											],
										},
									},
								],
							],
							plugins: [
								require.resolve(
									'@babel/plugin-proposal-object-rest-spread'
								),
								require.resolve(
									'@babel/plugin-transform-react-jsx'
								),
								require.resolve(
									'@babel/plugin-proposal-async-generator-functions'
								),
								require.resolve(
									'@babel/plugin-transform-runtime'
								),
								require.resolve(
									'@babel/plugin-proposal-class-properties'
								),
								NODE_ENV === 'production'
									? require.resolve(
											'babel-plugin-transform-react-remove-prop-types'
									  )
									: false,
							].filter( Boolean ),
						},
					},
				},
				{
					test: /\.s?css$/,
					exclude: /node_modules/,
					use: [
						MiniCssExtractPlugin.loader,
						{ loader: 'css-loader', options: { importLoaders: 1 } },
						'postcss-loader',
						{
							loader: 'sass-loader',
							query: {
								includePaths: [
									'assets/css/abstracts',
									'node_modules',
								],
								data: [
									'_colors',
									'_variables',
									'_breakpoints',
									'_mixins',
								]
									.map(
										( imported ) =>
											`@import "${ imported }";`
									)
									.join( ' ' ),
							},
						},
					],
				},
			],
		},
		plugins: [
			new WebpackRTLPlugin( {
				filename: `[name]-rtl.css`,
				minify: {
					safe: true,
				},
			} ),
			new MiniCssExtractPlugin( {
				filename: `[name].css`,
			} ),
			new ProgressBarPlugin( {
				format:
					chalk.blue( 'Build payment method extension scripts' ) +
					' [:bar] ' +
					chalk.green( ':percent' ) +
					' :msg (:elapsed seconds)',
			} ),
			new DependencyExtractionWebpackPlugin( {
				injectPolyfill: true,
				requestToExternal,
				requestToHandle,
			} ),
			new NormalModuleReplacementPlugin(
				/dashicon/,
				( result ) => ( result.resource = dashIconReplacementModule )
			),
		],
		resolve,
	};
};

module.exports = {
	getAlias,
	getFrontConfig,
	getMainConfig,
	getPaymentMethodsExtensionConfig,
};
