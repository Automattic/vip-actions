const OpenAPIParser = require( '@readme/openapi-parser' );

let url;
if ( process.argv[ 2 ] ) {
	url = process.argv[ 2 ];
} else {
	console.error( 'Usage: node swagger-validator.js <URL>' );
	throw new Error( 'URL is required' );
}

OpenAPIParser.validate( url, { continueOnError: true }, ( err, api ) => {
	if ( err ) {
		console.error( err );
		throw err;
	} else {
		console.log( 'API name: %s, Version: %s', api.info.title, api.info.version );
	}
} );
