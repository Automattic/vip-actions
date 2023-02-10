import {
	CheckRunDetails,
	Octokit,
	PullRequestFromGet,
	PullRequestFromList,
} from '../src/types/Github';
import type { PartialDeep } from 'type-fest';
import { faker } from '@faker-js/faker';
import { getPullRequests, isPullRequestCheckSuccessful } from '../src/github';
import * as github from '@actions/github';
import * as core from '@actions/core';

jest.mock( '@actions/github' );
jest.mock( '@actions/core' );

const getMockPullRequest = (): PartialDeep< PullRequestFromGet > => {
	return {
		number: Number( faker.unique( faker.random.numeric ) ),
		user: {
			login: 'dependabot[bot]',
		},
	};
};

const getOctokitReturnMock: PartialDeep< Octokit > = {
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
									status: 'completed',
								},
								{
									name: 'Try and bake cookies',
									status: 'queued',
								},
								{
									name: 'Run tests',
									status: 'completed',
								},
								{
									name: 'Send notifications',
									status: 'in_progress',
								},
							],
						},
					};
				}
			) as any,
		},
		pulls: {
			createReview: jest.fn() as any,
			merge: jest.fn() as any,
			get: jest.fn( async (): Promise< { data: PartialDeep< PullRequestFromGet > } > => {
				return {
					data: getMockPullRequest() as any,
				};
			} ) as any,
		},
	},
};

jest.mock( '../src/github', () => {
	const actual = jest.requireActual( '../src/github' );

	return {
		...actual,
		__esModule: true,
		getAllGitHubItems: jest.fn( async (): Promise< PartialDeep< PullRequestFromList >[] > => {
			return [
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
			];
		} ),
		getOctoKit: jest.fn( async (): Promise< PartialDeep< Octokit > > => {
			return getOctokitReturnMock as any;
		} ),
		createReview: jest.fn(),
	};
} );

describe( 'github', () => {
	describe( 'getOctoKit', () => {
		it( 'should call GitHub APIs to get the token', () => {
			const token = '123';
			jest.mocked( core.getInput ).mockImplementation( () => token );

			const { getOctokit } = jest.requireActual(
				'../src/github'
			) as typeof import( '../src/github' );
			getOctokit( false );

			expect( core.getInput ).toBeCalledWith( 'GITHUB_TOKEN' );
			expect( github.getOctokit ).toBeCalledWith( token );
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
			const requiredChecks = [ 'Linting', 'Run tests' ];
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
			const pullRequest = getMockPullRequest();
			await approvePullRequest( pullRequest as any, 'doesntmatter', 'doesntmatter' );
			expect( getOctokitReturnMock.rest?.pulls?.createReview ).toBeCalledWith( {
				pull_number: pullRequest.number,
				repo: 'doesntmatter',
				owner: 'doesntmatter',
				event: 'APPROVE',
			} );
		} );
	} );

	// describe('isPullRequestApproved', () => {
	// 	it('should return true if at least one review has approved it', async () => {
	//
	// 	})
	// 	it('should return false if no one has approved it', async () => {
	//
	// 	})
	// })
	//
	// describe('mergePullRequest', () => {
	//
	// })
	//
	// describe('callMarkAutoMergePullRequestEndpoint', () => {
	//
	// })
} );

export {};
