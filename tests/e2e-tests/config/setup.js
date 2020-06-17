/* eslint-disable no-console */
/**
 * External dependencies
 */
import { setup as setupPuppeteer } from 'jest-environment-puppeteer';
/**
 * Internal dependencies
 */
import {
	setupSettings,
	createTaxes,
	createCoupons,
	createProducts,
	createReviews,
	createShippingZones,
	createBlockPages,
	enablePaymentGateways,
	createProductAttributes,
} from '../fixtures/fixture-loaders';

module.exports = async ( globalConfig ) => {
	// we need to load puppeteer global setup here.
	await setupPuppeteer( globalConfig );


	try {
		/**
		 * Promise.all will return an array of all promises resolved values.
		 * Some functions like setupSettings and enablePaymentGateways resolve
		 * to server data so we ignore the values here.
		 */
		const results = await Promise.allSettled( [
			createProducts(),
			createTaxes(),
			createCoupons(),
			createShippingZones(),
			createBlockPages(),
			createProductAttributes(),
			enablePaymentGateways(),
			setupSettings(),
		] );

		const { value: _products } = results[ 0 ];

			/**
			 * Reviews depends a product.
			 */
			 await createReviews( _products[ 0 ] );
			 const [
				products,
				taxes,
				coupons,
				shippingZones,
				pages,
				attributes,
			] = results
				.filter( ( { status } ) => status === 'fulfilled' )
				.map( ( { value } ) => value );
		global.fixtureData = {
			taxes,
			coupons,
			products,
			shippingZones,
			pages,
			attributes
		};
	} catch ( e ) {
		console.log( e );
	}
};
