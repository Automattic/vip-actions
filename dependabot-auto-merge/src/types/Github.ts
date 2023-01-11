import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types';
import type { GitHub } from '@actions/github/lib/utils';

export type Octokit = InstanceType< typeof GitHub >;

export type PullRequest = RestEndpointMethodTypes[ 'pulls' ][ 'list' ][ 'response' ][ 'data' ][ 0 ];

export type BranchProtection =
	RestEndpointMethodTypes[ 'repos' ][ 'getBranchProtection' ][ 'response' ][ 'data' ];

export type CheckRunDetails =
	RestEndpointMethodTypes[ 'checks' ][ 'listForRef' ][ 'response' ][ 'data' ];

export type CheckRun = CheckRunDetails[ 'check_runs' ][ 0 ];

export type PullRequestReview =
	RestEndpointMethodTypes[ 'pulls' ][ 'createReview' ][ 'response' ][ 'data' ];
