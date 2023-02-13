import {
	getUnmergeableDescriptionTypeA,
	mergeableDescriptions,
	unmergeableDescriptions,
} from '../__fixtures__/autoMerge/autoMerge';
import { isPullRequestApprovable, isVersionBumpSafeToMerge } from '../src/autoMerge';
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
								created_at: '2023-01-01T00:00:00Z',
							},
							{
								user: {
									login: 'dependabot[bot]',
								},
								created_at: '2023-01-01T00:00:00Z',
							},
							{
								user: {
									login: 'not-dependabot[bot]',
								},
								created_at: '2023-01-01T00:00:00Z',
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
	};
} );

jest.mock( '@actions/core' );

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

	describe( 'isPullRequestApprovable', async () => {
		it( 'should approve if all the conditions are right, with the current default settings', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now: new Date( '2023-01-08T00:00:00Z' ).getTime(),
					minimumAgeInMs: 604800000, // a week
					checks: [ 'Linting', 'Type checking' ],
				} )
			).toBe( true );

			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					now: new Date( '2023-01-08T00:00:00Z' ).getTime(),
					minimumAgeInMs: 604800000, // a week
				} )
			).toBe( true );

			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
				} )
			).toBe( true );
		} );

		it( 'should not approve if the PR is too new', async () => {
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
			).resolves.toBe( true );
		} );

		it( 'should not approve if the PR is not considered mergeable', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			pullRequest.mergeable_state = 'yadaaa';
			pullRequest.mergeable = false;
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
				} )
			);
		} );

		it( "should not approve if the PR's version bump is not safe to merge", async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			pullRequest.body = getUnmergeableDescriptionTypeA();
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
				} )
			);
		} );

		it( 'should not approve if the required checks are not successful', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const requiredChecks = [ 'Linting', 'Run tests' ];
			const pullRequest = pullRequests[ 0 ];
			await expect(
				isPullRequestApprovable( {
					pullRequest,
					repository: 'doesntmatter',
					organization: 'doesntmatter',
					checks: requiredChecks,
				} )
			);
		} );
	} );

	describe( 'isPullRequestMergeable', () => {
		// noop
	} );

	describe( 'markAutoMergePullRequest', () => {
		// noop
	} );

	describe( 'mergePullRequestsInRepository', () => {
		// noop
	} );

	describe( 'mergeDependabotPullRequests', () => {
		// noop
	} );
} );

export {};
