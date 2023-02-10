import * as fs from 'fs';
import * as path from 'path';

/**
 * Example: https://github.com/Automattic/vip-go-media-management-service/pull/842
 */
export const getDescriptionTypeA = () => {
	return fs.readFileSync( path.join( __dirname, './descriptionTypeA.txt' ) );
};

/**
 * Example: https://github.com/Automattic/vip-go-media-management-service/pull/852
 */
export const getDescriptionTypeB = () => {
	return fs.readFileSync( path.join( __dirname, './descriptionTypeB.txt' ) );
};

export const descriptions = [ getDescriptionTypeA(), getDescriptionTypeB() ];
