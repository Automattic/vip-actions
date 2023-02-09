// Feel free to delete this file in an unrelated PR.

const makeBreakfast = ( how: string ) => {
	if ( how === 'by hand' ) {
		return true;
	}

	return false;
};

describe( 'breakfast', () => {
	it( 'should be made by hand', () => {
		expect( makeBreakfast( 'by hand' ) ).toBe( true );
	} );

	it( 'should not be made if not by hand', () => {
		expect( makeBreakfast( 'by feet' ) ).toBe( false );
	} );
} );

export {};
