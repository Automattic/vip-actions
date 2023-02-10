import { PullRequestFromGet } from './types/GitHub';
import {
	approvePullRequest,
	callMarkAutoMergePullRequestEndpoint,
	getPullRequests,
	isPullRequestApproved,
	isPullRequestCheckSuccessful,
	mergePullRequest,
} from './github';
import { satisfies } from 'semver';
import promiseLimit from 'promise-limit';
import * as github from '@actions/github';

/**
 * Checks if the version bump is safe to merge.
 *
 * It's safe when all the root dependencies are minor or patch version bumps.
 *
 * Ideally we should be using dependabot's metadata
 *
 * @param description Pull request description
 */
export function isVersionBumpSafeToMerge( description: string ) {
	let hasMatch = false;

	const lines = description.split( '\n' );
	for ( const line of lines ) {
		// two possible formats both in a new line
		// Updates `@nestjs/jwt` from 9.0.0 to 10.0.1
		// example: https://github.com/Automattic/vip-go-media-management-service/pull/842
		// Bumps [@nestjs/axios](https://github.com/nestjs/axios) from 0.1.0 to 1.0.1.
		// example: https://github.com/Automattic/vip-go-media-management-service/pull/852
		// regex match for both version numbers
		// TODO: Optimize further - get the packages from the title and stop processing more strings after we found all lines.

		let match = line.match( /^Updates `[@a-zA-Z\-/0-9]+` from ([0-9.]+) to ([0-9.]+)$/ ) || [];
		if ( match.length !== 3 ) {
			match =
				line.match(
					/^Bumps \[[@a-zA-Z\-/0-9]+\]\(https:\/\/github.com\/.*\) from ([0-9.]+) to ([0-9.]+)\.$/
				) || [];
		}
		// if both doesn't match, we skip this line
		if ( match.length !== 3 ) {
			continue;
		}

		const oldVersion = match[ 1 ];

		const newVersion = match[ 2 ];

		hasMatch = true;

		// if at least one version does not satisfy the patch version, then it's not safe to bump version
		if ( ! satisfies( newVersion, `^${ oldVersion }` ) ) {
			return false;
		}
	}

	return hasMatch;
}

export async function isPullRequestApprovable( {
	pullRequest,
	organization,
	repository,
	now = Date.now(),
	minimumAgeInMs = 0, // use PERIOD_WEEK = 604800000 for a week
	checks,
}: {
	pullRequest: PullRequestFromGet;
	organization: string;
	repository: string;
	now?: number;
	checks?: string[];
	minimumAgeInMs?: number;
} ): Promise< boolean > {
	const createdAt = new Date( pullRequest.created_at ).getTime();

	if ( now - createdAt < minimumAgeInMs ) {
		return false;
	}

	if ( pullRequest.user?.login !== 'dependabot[bot]' ) {
		return false;
	}

	if ( ! isPullRequestMergeable( pullRequest ) ) {
		return false;
	}

	if ( ! isVersionBumpSafeToMerge( pullRequest.body || '' ) ) {
		return false;
	}

	if ( checks ) {
		const isCheckSuccessful = await isPullRequestCheckSuccessful(
			pullRequest,
			organization,
			repository,
			checks
		);
		if ( ! isCheckSuccessful ) {
			return false;
		}
	}

	return true;
}

export function isPullRequestMergeable( pullRequest: PullRequestFromGet ) {
	return pullRequest.mergeable_state === 'clean' && pullRequest.mergeable === true;
}

export async function markAutoMergePullRequest(
	pullRequest: PullRequestFromGet,
	organization: string,
	repository: string
) {
	try {
		if ( ! ( await isPullRequestApproved( pullRequest, organization, repository ) ) ) {
			await approvePullRequest( pullRequest, organization, repository );
		}
		try {
			await callMarkAutoMergePullRequestEndpoint( pullRequest );
		} catch ( e ) {
			const error = e as Error;
			if (
				`${ error.message }`.match( /"Pull request Pull request is in clean status"/ ) &&
				isPullRequestMergeable( pullRequest )
			) {
				await mergePullRequest( pullRequest, organization, repository );
			} else {
				throw e;
			}
		}
		console.log( `Pull request ${ pullRequest.title } has been marked as auto-mergeable` );
	} catch ( e ) {
		const error = e as Error;
		console.error(
			`Merge pull request failed for ${ pullRequest.number } on organization ${ organization } and repository ${ repository } with error ${ error.message }. Stack trace: ${ error.stack }`
		);
	}
}

export async function mergePullRequestsInRepository(
	organization: string,
	repository: string,
	now = Date.now()
) {
	const concurrencyLimit = promiseLimit< any >( 1 );
	const pullRequests = await getPullRequests( organization, repository );

	const approvablePullRequestsWithNull = await Promise.all(
		pullRequests.map( async pullRequest => {
			const isApprovable: boolean = await concurrencyLimit( () =>
				isPullRequestApprovable( { pullRequest, organization, repository, now } )
			);

			return isApprovable ? pullRequest : null;
		} )
	);

	const approvablePullRequests = approvablePullRequestsWithNull.filter(
		pullRequest => pullRequest
	) as PullRequestFromGet[];

	await Promise.all(
		approvablePullRequests.map( pullRequest =>
			concurrencyLimit( async () =>
				markAutoMergePullRequest( pullRequest, organization, repository )
			)
		)
	);
}

export async function mergeDependabotPullRequests() {
	const now = Date.now();
	const organization = github.context.repo.owner;
	const repository = github.context.repo.repo;

	return await mergePullRequestsInRepository( organization, repository, now );
}
