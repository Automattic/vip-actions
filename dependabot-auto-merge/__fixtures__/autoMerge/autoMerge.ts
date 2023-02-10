import * as fs from 'fs';
import * as path from 'path';

/**
 * Example: https://github.com/Automattic/vip-go-media-management-service/pull/842
 */
export const getMergeableDescriptionTypeA = () => {
	return fs.readFileSync( path.join( __dirname, './mergeableDescriptionTypeA.txt' ) ).toString();
};

/**
 * Example: https://github.com/Automattic/vip-go-media-management-service/pull/852
 */
export const getMergeableDescriptionTypeB = () => {
	return fs.readFileSync( path.join( __dirname, './mergeableDescriptionTypeB.txt' ) ).toString();
};

/**
 * Example: https://github.com/Automattic/vip-go-media-management-service/pull/842
 */
export const getUnmergeableDescriptionTypeA = () => {
	return fs.readFileSync( path.join( __dirname, './unmergeableDescriptionTypeA.txt' ) ).toString();
};

/**
 * Example: https://github.com/Automattic/vip-go-media-management-service/pull/852
 */
export const getUnmergeableDescriptionTypeB = () => {
	return fs.readFileSync( path.join( __dirname, './unmergeableDescriptionTypeB.txt' ) ).toString();
};

export const mergeableDescriptions = [
	getMergeableDescriptionTypeA(),
	getMergeableDescriptionTypeB(),
];
export const unmergeableDescriptions = [
	getUnmergeableDescriptionTypeA(),
	getUnmergeableDescriptionTypeB(),
];
