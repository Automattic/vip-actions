import * as github from '@actions/github';
import * as core from '@actions/core';
import { Octokit, PullRequest, PullRequestReview } from './types/Github';

let octokitCache: Octokit | null = null;

const getOctokit = (): Octokit => {
	if ( octokitCache ) {
		return octokitCache;
	}

	const token = core.getInput( 'GITHUB_TOKEN' );

	const octokitInstance = github.getOctokit( token );

	octokitCache = octokitInstance;

	return octokitCache;
};

export async function getAllGitHubItems<
	T extends( ...args: any ) => U,
	U extends Promise< { data: V } >,
	V
>(
	octokitCallable: T,
	params: Parameters< T >[ 0 ]
): Promise< Awaited< ReturnType< T > >[ 'data' ] > {
	const items = [] as any[];

	let nextLink = 'firstLink';
	let pageNumber = 1;

	while ( nextLink ) {
		// eslint-disable-next-line no-await-in-loop
		const result = await octokitCallable( {
			per_page: 100,
			page: pageNumber,
			...params,
		} );

		items.push( ...( result.data as any ) );

		nextLink = ( result as any ).headers.link;

		pageNumber++;
	}

	return items as any;
}

export async function getPullRequests( organization: string, repository: string ) {
	const octokit = getOctokit();
	return getAllGitHubItems( octokit.rest.pulls.list, {
		owner: organization,
		repo: repository,
	} );
}

/**
 * This function is unused as we're now doing auto-merge - so we let GitHub identify whether the
 * check is successful or not (which may or may not be a bad idea)
 * We may re-require this in the future if we wanted to add extra conditionals.
 *
 * @param pullRequest
 * @param organization
 * @param repository
 */
export async function isPullRequestCheckSuccessful(
	pullRequest: PullRequest,
	organization: string,
	repository: string
) {
	const ref = pullRequest.head.sha;

	const baseBranch = pullRequest.base.ref;

	// TODO: Cache me.
	const branchProtectionResponse = await getOctokit().rest.repos.getBranchProtection( {
		owner: organization,
		repo: repository,
		branch: baseBranch,
	} );

	const branchProtectionDetails = branchProtectionResponse.data;

	const requiredContexts = branchProtectionDetails.required_status_checks?.contexts || [];

	if ( requiredContexts.length === 0 ) {
		// branch has no protection, so check is assumed not successful
		return false;
	}

	const requiredContextsDict = requiredContexts.reduce< Record< string, true > >(
		( previousValue, currentValue ) => {
			previousValue[ currentValue ] = true;

			return previousValue;
		},
		{}
	);

	const response = await getOctokit().rest.checks.listForRef( {
		owner: organization,
		repo: repository,
		ref,
	} );
	const checkRunsDetail = response.data;

	// checkRun.name has the same value as required status check's context.
	// and this isn't documented by GitHub
	const successfulAndRequiredCheckRuns = checkRunsDetail.check_runs.filter(
		checkRun =>
			requiredContextsDict[ checkRun.name ] &&
			[ 'success', 'skipped' ].includes( checkRun.conclusion || '' )
	);

	if ( successfulAndRequiredCheckRuns.length === 0 ) {
		// if nothing succeeded, then we'll fail the check too
		return false;
	}

	// the number of successful checks should be the same as the number of required contexts.
	// if it's not we'd have to check our code.
	return requiredContexts.length === successfulAndRequiredCheckRuns.length;
}

export async function approvePullRequest(
	pullRequest: PullRequest,
	organization: string,
	repository: string
): Promise< PullRequestReview > {
	const response = await getOctokit().rest.pulls.createReview( {
		pull_number: pullRequest.number,
		repo: repository,
		owner: organization,
		event: 'APPROVE',
	} );

	return response.data;
}

export async function isPullRequestApproved(
	pullRequest: PullRequest,
	organization: string,
	repository: string
): Promise< boolean > {
	const reviews = await getAllGitHubItems( getOctokit().rest.pulls.listReviews, {
		owner: organization,
		repo: repository,
		pull_number: pullRequest.number,
	} );

	return reviews.some( review => review.state === 'APPROVED' );
}

export async function markAutoMergeOnPullRequest( pullRequest: PullRequest ): Promise< boolean > {
	// language=GraphQL
	const query = `mutation MarkAutoMergeOnPullRequest($pullRequestId: ID!) {
      enablePullRequestAutoMerge( input: {
					pullRequestId: $pullRequestid
			} ) {
					__typename
			}
	}`;

	const variables = {
		pullRequestNumber: pullRequest.id,
	};

	await getOctokit().graphql( query, variables );

	return true;
}
