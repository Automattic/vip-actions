import {
	getMergeableDescriptionTypeA,
	getUnmergeableDescriptionTypeA,
	mergeableDescriptions,
	unmergeableDescriptions,
} from '../__fixtures__/autoMerge/autoMerge';

import * as autoMerge from '../src/autoMerge';

const {
	isPullRequestApprovable,
	isPullRequestMergeable,
	isVersionBumpSafeToMerge,
	markAutoMergePullRequest,
} = autoMerge;

import type { PartialDeep } from 'type-fest';
import {
	CheckRunDetails,
	Octokit,
	PullRequestFromGet,
	PullRequestFromList,
	PullRequestReview,
} from '../src/types/GitHub';
import { faker } from '@faker-js/faker';
import { getPullRequests } from '../src/github';

const mockGetPullRequest = (): PartialDeep< PullRequestFromGet > => {
	return {
		head: {
			sha: faker.datatype.hexadecimal( {
				length: 40,
				prefix: '',
				case: 'lower',
			} ),
		},
		node_id: faker.helpers.unique( faker.random.numeric, [ 10 ] ),
		number: Number( faker.helpers.unique( faker.random.numeric, [ 10 ] ) ),
		user: {
			login: 'dependabot[bot]',
		},
		created_at: '2023-01-01T00:00:00Z',
		mergeable: true,
		mergeable_state: 'clean',
		body: getMergeableDescriptionTypeA(),
	};
};

const mockGetOctokitReturn: PartialDeep< Octokit > = {
	graphql: jest.fn() as any,
	rest: {
		repos: {
			getBranchProtection: jest.fn() as any,
		},
		checks: {
			listForRef: jest.fn(
				async (): Promise< {
					data: PartialDeep< CheckRunDetails, { recurseIntoArrays: true } >;
				} > => {
					return {
						data: {
							check_runs: [
								{
									name: 'Linting',
									conclusion: 'success',
								},
								{
									name: 'Type checking',
									conclusion: 'success',
								},
								{
									name: 'Try and bake cookies',
									conclusion: 'failure',
								},
								{
									name: 'Run tests',
									conclusion: 'skipped',
								},
								{
									name: 'Send notifications',
									conclusion: null,
								},
							],
						},
					};
				}
			) as any,
		},
		pulls: {
			createReview: jest.fn( () => ( { data: {} } ) ) as any,
			merge: jest.fn() as any,
			get: jest.fn( async (): Promise< { data: PartialDeep< PullRequestFromGet > } > => {
				return {
					data: mockGetPullRequest() as any,
				};
			} ) as any,
			list: jest.fn(
				async (): Promise< {
					headers: { link?: string };
					data: PartialDeep< PullRequestFromList >[];
				} > => {
					return {
						headers: {},
						data: [
							{
								user: {
									login: 'dependabot[bot]',
								},
							},
							{
								user: {
									login: 'dependabot[bot]',
								},
							},
							{
								user: {
									login: 'not-dependabot[bot]',
								},
							},
						],
					};
				}
			) as any,
			listReviews: jest.fn(
				async (): Promise< {
					headers: { link?: string };
					data: PartialDeep< PullRequestReview >[];
				} > => {
					return {
						headers: {},
						data: [
							{
								state: 'APPROVED',
							},
							{
								state: 'CHANGES_REQUESTED',
							},
							{
								state: 'COMMENTED',
							},
						],
					};
				}
			) as any,
		},
	},
};

jest.mock( '@actions/github', () => {
	return {
		__esModule: true,
		getOctokit: jest.fn( () => mockGetOctokitReturn ),
		context: {
			repo: {
				repo: 'doesntmatter',
				owner: 'doesntmatter',
			},
		},
	};
} );

jest.mock( '@actions/core' );

const now = new Date( '2023-01-08T00:00:00Z' ).getTime();

describe( 'autoMerge', () => {
	describe( 'isVersionBumpSafeToMerge', () => {
		it.each( mergeableDescriptions )(
			'should return true if the PR description has safe version bumps',
			( description: string ) => {
				expect( isVersionBumpSafeToMerge( description ) ).toBe( true );
			}
		);

		it.each( unmergeableDescriptions )(
			'should return false if the PR description has unsafe version bumps',
			( description: string ) => {
				expect( isVersionBumpSafeToMerge( description ) ).toBe( false );
			}
		);

		it.each( [
			{
				description: '',
				type: 'an empty string',
			},
		] )(
			'should return false for the edge case where the description is $type',
			( { description } ) => {
				expect( isVersionBumpSafeToMerge( description ) ).toBe( false );
			}
		);
	} );

	describe( 'isPullRequestApprovable', () => {
		it( 'should return true if all the conditions are right, with the current default settings', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now,
					minimumAgeInMs: 604800000, // a week
					checks: [ 'Linting', 'Type checking' ],
				} )
			).resolves.toBe( true );

			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now,
					minimumAgeInMs: 604800000, // a week
				} )
			).resolves.toBe( true );

			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now,
				} )
			).resolves.toBe( true );
		} );

		it( 'should return false approve if the PR is too new', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];

			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now: new Date( '2023-01-07T23:59:59Z' ).getTime(),
					minimumAgeInMs: 604800000, // a week
				} )
			).resolves.toBe( false );
		} );

		it( 'should return false if the PR is not considered mergeable', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			pullRequest.mergeable_state = 'yadaaa';
			pullRequest.mergeable = false;
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now,
				} )
			).resolves.toBe( false );
		} );

		it( "should return false if the PR's version bump is not safe to merge", async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			pullRequest.body = getUnmergeableDescriptionTypeA();
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now,
				} )
			).resolves.toBe( false );
		} );

		it( 'should not approve if the required checks are not successful', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const requiredChecks = [ 'Linting', 'Try and bake cookies' ];
			const pullRequest = pullRequests[ 0 ];
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now,
					checks: requiredChecks,
				} )
			).resolves.toBe( false );
		} );
	} );

	describe( 'isPullRequestMergeable', () => {
		it( "should return true if it's considered mergeable", async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			expect( isPullRequestMergeable( pullRequest ) ).toBe( true );
		} );

		it( "should return false if it's considered unmergeable", async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			pullRequest.mergeable = false;
			expect( isPullRequestMergeable( pullRequest ) ).toBe( false );
		} );
	} );

	describe( 'markAutoMergePullRequest', () => {
		it( 'should call GitHub API to mark a pull request as auto-mergeable', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			await markAutoMergePullRequest( pullRequest, 'doesntmatter', 'doesntmatter' );
			expect( mockGetOctokitReturn.graphql ).toBeCalled();
			expect( mockGetOctokitReturn?.rest?.pulls?.merge ).not.toBeCalled();
		} );

		it( "should merge anyway if it's mergeable but the GitHub API's mark automerge failed", async () => {
			const mockGraphQL = jest.mocked( mockGetOctokitReturn.graphql || jest.fn() );
			mockGraphQL.mockImplementation( async () => {
				throw new Error( `Request failed due to following response errors:
 - ["Pull request Pull request is in clean status"]` );
				const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
				const pullRequest = pullRequests[ 0 ];
				await markAutoMergePullRequest( pullRequest, 'doesntmatter', 'doesntmatter' );
				await expect( mockGraphQL.mock.results[ 0 ] ).rejects.toThrow(
					/"Pull request Pull request is in clean status"/
				);
				expect( mockGetOctokitReturn?.rest?.pulls?.merge ).toBeCalled();
			} );
		} );
	} );

	describe( 'mergePullRequestsInRepository', () => {
		it( 'should start the logic for marking pull requests as auto-mergeable on all dependabot PRs', async () => {
			jest.spyOn( autoMerge, 'isPullRequestApprovable' );
			jest.spyOn( autoMerge, 'markAutoMergePullRequest' );
			await autoMerge.mergePullRequestsInRepository( 'doesntmatter', 'doesntmatter', now );

			expect( autoMerge.isPullRequestApprovable ).toBeCalledTimes( 2 );
			expect( autoMerge.markAutoMergePullRequest ).toBeCalledTimes( 2 );
		} );
	} );

	describe( 'mergeDependabotPullRequests', () => {
		it( 'should call mergePullRequestsInRepository with the expected parameters', async () => {
			const spyMergePullRequestsInRepository = jest.spyOn(
				autoMerge,
				'mergePullRequestsInRepository'
			);
			await autoMerge.mergeDependabotPullRequests();
			expect( spyMergePullRequestsInRepository.mock.calls[ 0 ][ 0 ] ).toBe( 'doesntmatter' );
			expect( spyMergePullRequestsInRepository.mock.calls[ 0 ][ 1 ] ).toBe( 'doesntmatter' );
		} );
	} );
} );

export {};
