import { validate } from '@readme/openapi-parser';

let url;
if ( process.argv[ 2 ] ) {
	url = process.argv[ 2 ];
} else {
	console.error( 'Usage: node swagger-validator.js <URL>' );
	throw new Error( 'URL is required' );
}

validate( url )
	.then( result => {
		if ( result.valid ) {
			console.log( 'The API definition is valid!' );
		} else {
			console.log( 'The API definition is NOT valid!' );
			result.errors.forEach( err => {
				console.log( '- %s', err.message );
			} );
		}

		result.warnings.forEach( warning => {
			console.log( '(!) %s', warning.message );
		} );
	} )
	.catch( err => {
		console.error( err );
		throw err;
	} );
