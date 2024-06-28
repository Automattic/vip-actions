const OpenAPIParser = require( '@readme/openapi-parser' );

const url = process.argv[ 2 ];

OpenAPIParser.validate( url, { continueOnError: true }, ( err, api ) => {
	if ( err ) {
		console.error( err );
		throw err;
	} else {
		console.log( 'API name: %s, Version: %s', api.info.title, api.info.version );
	}
} );
