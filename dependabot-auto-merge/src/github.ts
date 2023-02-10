import * as github from '@actions/github';
import * as core from '@actions/core';
import {
	Octokit,
	PullRequestFromGet,
	PullRequestFromList,
	PullRequestReview,
} from './types/Github';

let octokitCache: Octokit | null = null;

export const getOctokit = ( isCached = true ): Octokit => {
	if ( octokitCache && isCached ) {
		return octokitCache;
	}

	const token = core.getInput( 'GITHUB_TOKEN' );

	const octokitInstance = github.getOctokit( token );

	octokitCache = octokitInstance;

	if ( ! octokitCache ) {
		throw new Error( 'Failed to initialize Octokit' );
	}

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

export async function getPullRequests(
	organization: string,
	repository: string
): Promise< PullRequestFromGet[] > {
	const octokit = getOctokit();
	const pullRequestsFromListAPI: PullRequestFromList[] = await getAllGitHubItems(
		octokit.rest.pulls.list,
		{
			owner: organization,
			repo: repository,
		}
	);

	return await Promise.all(
		pullRequestsFromListAPI
			.filter( pullRequest => pullRequest.user?.login === 'dependabot[bot]' )
			.map( async pullRequest => {
				const request = await octokit.rest.pulls.get( {
					pull_number: pullRequest.number,
					repo: repository,
					owner: organization,
				} );

				return request.data;
			} )
	);
}

/**
 * This function checks if the latest run has all the checks in the required checks be successful.
 *
 * @param pullRequest
 * @param organization
 * @param repository
 * @param requiredCheckRunNames
 */
export async function isPullRequestCheckSuccessful(
	pullRequest: PullRequestFromGet,
	organization: string,
	repository: string,
	requiredCheckRunNames: string[]
) {
	const ref = pullRequest.head.sha;

	const requiredCheckRunNamesDict = requiredCheckRunNames.reduce< Record< string, true > >(
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

	const successfulAndRequiredCheckRuns = checkRunsDetail.check_runs.filter(
		checkRun =>
			requiredCheckRunNamesDict[ checkRun.name ] &&
			[ 'success', 'skipped' ].includes( checkRun.conclusion || '' )
	);

	if ( successfulAndRequiredCheckRuns.length === 0 ) {
		// if nothing succeeded, then we'll fail the check too
		return false;
	}

	// the number of successful checks should be the same as the number of required contexts.
	// if it's not we'd have to check our code.
	return requiredCheckRunNames.length === successfulAndRequiredCheckRuns.length;
}

export async function approvePullRequest(
	pullRequest: PullRequestFromGet,
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
	pullRequest: PullRequestFromGet,
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

export async function mergePullRequest(
	pullRequest: PullRequestFromGet,
	organization: string,
	repository: string
) {
	return await getOctokit().rest.pulls.merge( {
		pull_number: pullRequest.number,
		repo: repository,
		owner: organization,
	} );
}

export async function callMarkAutoMergePullRequestEndpoint(
	pullRequest: PullRequestFromGet
): Promise< boolean > {
	/**
	 *
	 * Auto-merge will only work in the following condition:
	 *
	 * 1. The target repository must have allow auto-merge enabled in settings.
	 * 2. The pull request base must have a branch protection rule with at least one requirement enabled.
	 * 3. The pull request must be in a state where requirements have not yet been satisfied. If the pull request can already be merged, attempting to enable auto-merge will fail.
	 *
	 * I spent half a day debugging this especially for reason number 3,
	 * and I hope no one has to face that issue again.
	 *
	 * If you're getting `["Pull request Pull request is in clean status"]` error, this is why.
	 *
	 * Ref: https://github.com/peter-evans/enable-pull-request-automerge#conditions
	 */

	const query = `mutation MarkAutoMergeOnPullRequest($pullRequestId: ID!) {
              enablePullRequestAutoMerge( input: {
                  pullRequestId: $pullRequestId
              } ) {
                  __typename
              }
          }`;

	const variables = {
		// node_id is the same as the id in GraphQL
		pullRequestId: pullRequest.node_id,
	};

	await getOctokit().graphql( query, variables );

	return true;
}
