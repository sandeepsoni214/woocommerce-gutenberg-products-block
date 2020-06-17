/**
 * External dependencies
 */
import {
	insertBlock,
	getEditedPostContent,
	createNewPost,
	switchUserToAdmin,
} from '@wordpress/e2e-test-utils';

describe( 'All Reviews Block', () => {
	beforeEach( async () => {
		await switchUserToAdmin();
		await createNewPost();
	} );

	it( 'can be created', async () => {
		await insertBlock( 'All Reviews' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'shows reviews', async () => {
		await insertBlock( 'All Reviews' );
		await page.waitForSelector(
			'.wc-block-review-list .wc-block-review-list-item__item:not(.is-loading)'
		);
		expect(
			await page.$$eval(
				'.wc-block-review-list .wc-block-review-list-item__item',
				( reviews ) => reviews.length
			)
			// 3 is the value we load within our fixtures.
		).toBeGreaterThanOrEqual( 3 );
	} );
} );
