import {
	mergeableDescriptions,
	unmergeableDescriptions,
} from '../__fixtures__/autoMerge/autoMerge';
import { isVersionBumpSafeToMerge } from '../src/autoMerge';

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

	describe( 'checkPullRequestApprovable', () => {
		// noop
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
