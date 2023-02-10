import { mergeDependabotPullRequests } from './autoMerge';

mergeDependabotPullRequests()
	.then()
	.catch( err => {
		throw err;
	} );
