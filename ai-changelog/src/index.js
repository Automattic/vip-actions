import { env } from 'node:process';
import { debug, getInput, setFailed, setOutput, warning } from '@actions/core';
import { context, getOctokit } from '@actions/github';

function getParams() {
	const prNumber = +getInput( 'pr_number' );
	const what = getInput( 'analyze' ) || 'diff';
	const model = getInput( 'model' ) || 'gpt-4-turbo';
	const description = getInput( 'pr_description' ) ?? '';
	const token = getInput( 'token' ) || env.GITHUB_TOKEN;
	const openAiKey = getInput( 'openai_api_key' ) || env.OPENAI_API_KEY;

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
	const template = `You are assisting in generating a changelog entry from a pull request.
Given the pull request title, description, and diff, write a single Markdown list item summarizing the change.

Requirements:
  * Audience: General users with no technical background.

Style:
  * Clear, precise, and concise (1–2 short sentences).
  * Non-technical wording: Avoid code references, variable names, file paths, or developer jargon.
  * Focus on the visible impact or purpose of the change rather than implementation details.
  * Use active voice and present tense.

Input:
`;
	const { title, body } = await getPullRequestInfo( octokit, owner, repo, prNumber );
	const description = overriddenDescription || body;
	let info;
	switch ( what ) {
		case 'patch':
			info = await getPullRequestDiff( octokit, owner, repo, prNumber, 'patch' );
			break;

		case 'commits':
			info = await getPullRequestCommits( octokit, owner, repo, prNumber );
			break;

		default: {
			info = await getPullRequestDiff( octokit, owner, repo, prNumber, 'diff' );
			break;
		}
	}

	return `${ template }\n${ title }\n\n${ description }\n\n${ info }`;
}

/**
 * @param {string} prompt
 * @param {string} openAiKey
 * @param {string} model
 * @return {Promise<string>} Response from OpenAI
 */
async function askOpenAI( prompt, openAiKey, model ) {
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
	return data.choices?.[ 0 ]?.message?.content?.trim() ?? '';
}

async function run() {
	try {
		const { prNumber, token, openAiKey, what, model, description } = getParams();
		const { owner, repo } = context.repo;
		const octokit = getOctokit( token );

		let prompt = await getPrompt( octokit, owner, repo, prNumber, what, description );

		let changelogEntry = await askOpenAI( prompt, openAiKey, model );
		if ( ! changelogEntry ) {
			warning( 'No content returned from OpenAI' );
			if ( what !== 'commits' ) {
				debug( 'Retrying in `commits` mode' );
				prompt = await getPrompt( octokit, owner, repo, prNumber, 'commits', description );
				debug( `Generated prompt: ${ prompt }` );
				changelogEntry = await askOpenAI( prompt, openAiKey, model );
				if ( ! changelogEntry ) {
					warning( 'No content returned from OpenAI in `commits` mode' );
					return;
				}
			}
		}

		setOutput( 'changelog_entry', changelogEntry );
	} catch ( error ) {
		setFailed( error.message );
	}
}

run();
