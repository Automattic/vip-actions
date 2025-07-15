import { env } from 'node:process';
import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';

function getParams() {
	const prNumber = +getInput( 'pr_number' );
	const token = env.GITHUB_TOKEN;
	const openAiKey = env.OPENAI_API_KEY;

	if ( isNaN( prNumber ) || prNumber <= 0 ) {
		setFailed( 'Invalid PR number. It must be a positive integer.' );
		return null;
	}

	if ( ! token ) {
		setFailed( 'Missing GITHUB_TOKEN' );
		return null;
	}

	if ( ! openAiKey ) {
		setFailed( 'Missing OPENAI_API_KEY' );
		return null;
	}

	return {
		prNumber,
		token,
		openAiKey,
	};
}

/**
 * @param {ReturnType<typeof getOctokit>} octokit
 * @param {string}                        owner
 * @param {string}                        repo
 * @param {number}                        prNumber
 * @return {Promise<{ title: string, body: string }>} PR information
 */
async function getPullRequestInfo( octokit, owner, repo, prNumber ) {
	const { data } = await octokit.rest.pulls.get( {
		owner,
		repo,
		pull_number: prNumber,
	} );

	return {
		title: data.title,
		body: data.body ?? '',
	};
}

/**
 * @param {ReturnType<typeof getOctokit>} octokit
 * @param {string}                        owner
 * @param {string}                        repo
 * @param {number}                        prNumber
 * @return {Promise<string>} PR diff
 */
async function getPullRequestDiff( octokit, owner, repo, prNumber ) {
	const { data } = await octokit.rest.pulls.get( {
		owner,
		repo,
		pull_number: prNumber,
		mediaType: {
			format: 'diff',
		},
	} );

	/** @type {string} data */

	return data;
}

async function run() {
	try {
		const params = getParams();
		if ( ! params ) {
			return;
		}

		const { prNumber, token, openAiKey } = params;

		const octokit = getOctokit( token );
		const { owner, repo } = context.repo;

		const [ { title, body }, diff ] = await Promise.all( [
			getPullRequestInfo( octokit, owner, repo, prNumber ),
			getPullRequestDiff( octokit, owner, repo, prNumber ),
		] );

		const prompt = `Generate a non-technical changelog entry as a list entry for this pull request:
Title: ${ title }
Description: ${ body }
Diff: ${ diff }
Respond in 1-2 sentences, user-friendly language. The entry should be suitable for a general audience, avoiding technical details.`;

		// Call OpenAI API
		const response = await fetch( 'https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${ openAiKey }`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( {
				model: 'gpt-4-turbo',
				messages: [ { role: 'user', content: prompt } ],
				max_tokens: 200,
			} ),
		} );

		const data = await response.json();
		const changelogEntry = data.choices?.[ 0 ]?.message?.content?.trim();

		if ( ! changelogEntry ) {
			throw new Error( 'No content returned from OpenAI' );
		}

		info( `Generated changelog entry: ${ changelogEntry }` );

		// Post as comment to PR
		await octokit.rest.issues.createComment( {
			owner,
			repo,
			issue_number: prNumber,
			body: `### AI-Generated Changelog Entry\n${ changelogEntry }`,
		} );
	} catch ( error ) {
		setFailed( error.message );
	}
}

run();
