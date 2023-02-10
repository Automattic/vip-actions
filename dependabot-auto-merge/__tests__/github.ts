import {
	CheckRunDetails,
	Octokit,
	PullRequestFromGet,
	PullRequestFromList,
	PullRequestReview,
} from '../src/types/GitHub';
import type { PartialDeep } from 'type-fest';
import { faker } from '@faker-js/faker';
import * as actionsGithub from '@actions/github';
import * as actionsCore from '@actions/core';
import {
	callMarkAutoMergePullRequestEndpoint,
	getOctokit,
	getPullRequests,
	isPullRequestApproved,
	isPullRequestCheckSuccessful,
	mergePullRequest,
} from '../src/github';

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
	};
} );

jest.mock( '@actions/core' );

describe( 'github', () => {
	describe( 'getOctoKit', () => {
		it( 'should call GitHub APIs to get the token', () => {
			const token = '123';
			jest.mocked( actionsCore.getInput ).mockImplementationOnce( () => token );
			getOctokit( false );

			expect( actionsCore.getInput ).toBeCalledWith( 'GITHUB_TOKEN' );
			expect( actionsGithub.getOctokit ).toBeCalledWith( token );
		} );
	} );

	describe( 'getPullRequests', () => {
		it( 'should get all pull requests by dependabot', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			expect( pullRequests ).toHaveLength( 2 );
			pullRequests.forEach( pullRequest => {
				expect( pullRequest.user?.login ).toBe( 'dependabot[bot]' );
			} );
		} );
	} );

	describe( 'isPullRequestCheckSuccessful', () => {
		it( 'should return true if the required checks succeeded', async () => {
			const requiredChecks = [ 'Linting', 'Type checking', 'Run tests' ];
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );

			await expect(
				isPullRequestCheckSuccessful(
					pullRequests[ 0 ],
					'doesntmatter',
					'doesntmatter',
					requiredChecks
				)
			).resolves.toBe( true );
		} );

		it( 'should return false if the required checks did not succeed', async () => {
			const requiredChecks = [ 'Linting', 'Send notifications' ];
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );

			await expect(
				isPullRequestCheckSuccessful(
					pullRequests[ 0 ],
					'doesntmatter',
					'doesntmatter',
					requiredChecks
				)
			).resolves.toBe( false );
		} );

		it( 'should return false if there are no required checks added', async () => {
			const requiredChecks: any[] = [];
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );

			await expect(
				isPullRequestCheckSuccessful(
					pullRequests[ 0 ],
					'doesntmatter',
					'doesntmatter',
					requiredChecks
				)
			).resolves.toBe( false );
		} );
	} );

	describe( 'approvePullRequest', () => {
		it( 'should call GitHub APIs to approve pull requests', async () => {
			const { approvePullRequest } = jest.requireActual(
				'../src/github'
			) as typeof import( '../src/github' );
			const pullRequest = mockGetPullRequest();
			await approvePullRequest( pullRequest as any, 'doesntmatter', 'doesntmatter' );
			expect( mockGetOctokitReturn.rest?.pulls?.createReview ).toBeCalledWith( {
				pull_number: pullRequest.number,
				repo: 'doesntmatter',
				owner: 'doesntmatter',
				event: 'APPROVE',
			} );
		} );
	} );

	describe( 'isPullRequestApproved', () => {
		it( 'should return true if at least one review has approved it', async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			await expect(
				isPullRequestApproved( pullRequest, 'doesntmatter', 'doesntmatter' )
			).resolves.toBe( true );
		} );

		it( 'should return false if no one has approved it', async () => {
			// The weird || jest.fn() is just to satisfy types. We could use ! but eslint is unhappy.
			jest
				.mocked( mockGetOctokitReturn?.rest?.pulls?.listReviews || jest.fn() )
				.mockImplementationOnce( ( async (): Promise< {
					headers: { link?: string };
					data: PartialDeep< PullRequestReview >[];
				} > => {
					return {
						headers: {},
						data: [
							{
								state: 'COMMENTED',
							},
							{
								state: 'CHANGES_REQUESTED',
							},
							{
								state: 'COMMENTED',
							},
						],
					};
				} ) as any );
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			await expect(
				isPullRequestApproved( pullRequest, 'doesntmatter', 'doesntmatter' )
			).resolves.toBe( false );
		} );
	} );

	describe( 'mergePullRequest', () => {
		it( "should call GitHub's API to merge pull requests", async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			await mergePullRequest( pullRequest, 'doesntmatter', 'doesntmatter' );
			expect( mockGetOctokitReturn?.rest?.pulls?.merge ).toBeCalledWith( {
				pull_number: pullRequest.number,
				repo: 'doesntmatter',
				owner: 'doesntmatter',
			} );
		} );
	} );

	describe( 'callMarkAutoMergePullRequestEndpoint', () => {
		it( "should call GitHub's API to mark a PR as auto-mergeable", async () => {
			const pullRequests = await getPullRequests( 'doesntmatter', 'doesntmatter' );
			const pullRequest = pullRequests[ 0 ];
			await callMarkAutoMergePullRequestEndpoint( pullRequest );
			const graphqlMock = jest.mocked( mockGetOctokitReturn?.graphql );
			expect( graphqlMock?.mock.calls[ 0 ][ 0 ] ).toBeDefined();
			expect( graphqlMock?.mock.calls[ 0 ][ 1 ] ).toStrictEqual( {
				pullRequestId: pullRequest.node_id,
			} );
		} );
	} );
} );

export {};
