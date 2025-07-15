import { env } from 'node:process';
import { debug, getInput, setFailed, setOutput, warning } from '@actions/core';
import { context, getOctokit } from '@actions/github';

const prompts = {
	diff: `Generate a non-technical changelog entry as a markdown list entry for the pull request data below.
Respond in 1-2 sentences, user-friendly language. The entry should be suitable for a general audience, avoiding technical details.

PR Title: {{title}}
PR Description: {{body}}
PR formatted as a diff:
{{diff}}`,

	patch: `Generate a non-technical changelog entry as a markdown list entry for the pull request data below.
Respond in 1-2 sentences, user-friendly language. The entry should be suitable for a general audience, avoiding technical details.

PR Title: {{title}}
PR Description: {{body}}
PR formatted as a patch:
{{patch}}`,

	commits: `Generate a non-technical changelog entry as a markdown list entry for the pull request data below.
Respond in 1-2 sentences, user-friendly language. The entry should be suitable for a general audience, avoiding technical details.

PR Title: {{title}}
PR Description: {{body}}
List of commit messages:
{{commits}}`,
};

function getParams() {
	const prNumber = +getInput( 'pr_number' );
	const what = getInput( 'analyze' ) || 'diff';
	const model = getInput( 'model' ) || 'gpt-4-turbo';
	const description = getInput( 'pr-description' ) ?? '';
	const token = env.GITHUB_TOKEN;
	const openAiKey = env.OPENAI_API_KEY;

	if ( isNaN( prNumber ) || prNumber <= 0 ) {
		throw new Error( 'Invalid PR number. It must be a positive integer.' );
	}

	if ( ! token ) {
		throw new Error( 'Missing GITHUB_TOKEN' );
	}

	if ( ! openAiKey ) {
		throw new Error( 'Missing OPENAI_API_KEY' );
	}

	if ( ! [ 'diff', 'patch', 'commits' ].includes( what ) ) {
		throw new Error( `Invalid analyze option: ${ what }. Must be one of: diff, patch, commits.` );
	}

	return {
		prNumber,
		token,
		openAiKey,
		what,
		model,
		description,
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
 * @return {Promise<string[]>} PR information
 */
async function getPullRequestCommits( octokit, owner, repo, prNumber ) {
	const commitMessages = [];
	const iterator = octokit.paginate.iterator(
		octokit.rest.pulls.listCommits,
		{
			owner,
			repo,
			pull_number: prNumber,
			per_page: 100,
		}
	);

	for await ( const { data } of iterator ) {
		commitMessages.push( ...data.map( commit => commit.commit.message ) );
	}

	return commitMessages;
}

/**
 * @param {ReturnType<typeof getOctokit>} octokit
 * @param {string}                        owner
 * @param {string}                        repo
 * @param {number}                        prNumber
 * @param {string}                        format
 * @return {Promise<string>} PR diff
 */
async function getPullRequestDiff( octokit, owner, repo, prNumber, format ) {
	const { data } = await octokit.rest.pulls.get( {
		owner,
		repo,
		pull_number: prNumber,
		mediaType: {
			format,
		},
	} );

	/** @type {string} data */

	return data;
}

/**
 * @param {ReturnType<typeof getOctokit>} octokit
 * @param {string}                        owner
 * @param {string}                        repo
 * @param {number}                        prNumber
 * @param {string}                        what
 * @param {string}                        overriddenDescription
 * @return {Promise<string>} Prompt
 */
async function getPrompt( octokit, owner, repo, prNumber, what, overriddenDescription ) {
	const { title, body } = await getPullRequestInfo( octokit, owner, repo, prNumber );
	const description = overriddenDescription || body;
	switch ( what ) {
		case 'patch': {
			const patch = await getPullRequestDiff( octokit, owner, repo, prNumber, 'patch' );
			return prompts.patch
				.replace( '{{title}}', title )
				.replace( '{{body}}', description )
				.replace( '{{patch}}', patch );
		}

		case 'commits': {
			const commits = await getPullRequestCommits( octokit, owner, repo, prNumber );
			return prompts.commits
				.replace( '{{title}}', title )
				.replace( '{{body}}', description )
				.replace( '{{commits}}', commits.join( '\n' ) );
		}

		default: {
			const diff = await getPullRequestDiff( octokit, owner, repo, prNumber, 'diff' );
			return prompts.diff
				.replace( '{{title}}', title )
				.replace( '{{body}}', description )
				.replace( '{{diff}}', diff );
		}
	}
}

async function run() {
	try {
		const { prNumber, token, openAiKey, what, model, description } = getParams();
		const { owner, repo } = context.repo;
		const octokit = getOctokit( token );

		const prompt = await getPrompt( octokit, owner, repo, prNumber, what, description );
		debug( `Generated prompt: ${ prompt }` );

		const response = await fetch( 'https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${ openAiKey }`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( {
				model,
				messages: [ { role: 'user', content: prompt } ],
				max_tokens: 500,
			} ),
		} );

		const data = await response.json();
		const changelogEntry = data.choices?.[ 0 ]?.message?.content?.trim();

		if ( ! changelogEntry ) {
			warning( 'No content returned from OpenAI' );
		} else {
			setOutput( 'changelog-entry', changelogEntry );
		}
	} catch ( error ) {
		setFailed( error.message );
	}
}

run();
