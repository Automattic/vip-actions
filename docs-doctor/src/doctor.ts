import * as core from '@actions/core';
import { env } from 'node:process';
import * as github from '@actions/github';
import FirecrawlApp from '@mendable/firecrawl-js';
import * as aiSDK from 'ai';
import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { URL } from 'url';
import TurndownService from 'turndown';
import * as xml2js from 'xml2js';
import { technicalAccuracyReviewerPrompt, technicalContentUrlFinderPrompt } from './ai-prompts.js';

const PR_COMMENT_HEADER = `## 🤖 AI-Generated Docs Inconsistencies Report`;

// Security and timeout constants
const REQUEST_TIMEOUT = 30000; // 30 seconds per request

interface PullRequestInfo {
	title: string;
	description: string;
	diff: string;
}

interface RelatedDocsURL {
	url: string;
	confidence: number;
}

interface Inconsistency {
	url: string;
	inconsistency: string;
	evidence_from_doc: string | null;
	suggested_fix: string;
	severity: 'High' | 'Medium' | 'Low';
	confidence: number;
}

export class Doctor {
	private readonly url: string;
	private readonly openAIProvider: OpenAIProvider;
	private readonly openAIModel: string;
	private readonly octokit: ReturnType< typeof github.getOctokit >;
	private readonly confidenceThreshold: number;
	private readonly postComment: boolean;

	// URL list providers
	private readonly sitemapURL?: string;
	private readonly urlsFile?: string;
	private readonly firecrawlClient?: FirecrawlApp;

	private readonly prContext: {
		owner: string;
		repo: string;
		number: number;
	};

	constructor() {
		this.url = core.getInput( 'url', { required: true } );

		if ( ! this.isValidUrl( this.url ) ) {
			throw new Error( 'Invalid URL format or protocol not allowed' );
		}

		const openAIToken = core.getInput( 'openai_api_key', { required: true } );
		const prNumber = core.getInput( 'pr_number', { required: true } );

		const githubApiToken = env.GITHUB_TOKEN;
		const firecrawlApiKey = core.getInput( 'firecrawl_api_key' ) || env.FIRECRAWL_API_KEY;
		this.urlsFile = core.getInput( 'urls_file' );
		this.sitemapURL = core.getInput( 'sitemap_url' );

		if ( this.sitemapURL && ! this.isValidUrl( this.sitemapURL ) ) {
			throw new Error( 'Invalid Sitemap URL format or protocol not allowed' );
		}

		this.confidenceThreshold = Number( core.getInput( 'confidence_threshold' ) ) || 0.8;

		this.openAIModel = core.getInput( 'openai_model' ) || 'gpt-4o';

		this.postComment = core.getBooleanInput( 'post_comment' ) || false;

		if ( ! openAIToken ) {
			throw new Error( 'Missing OpenAI API key' );
		}

		if ( ! this.sitemapURL && ! this.urlsFile && ! firecrawlApiKey ) {
			throw new Error( 'Either sitemap_url, urls_file or firecrawl_api_key must be provided' );
		}

		if ( ! githubApiToken ) {
			throw new Error( 'Missing GitHub API token' );
		}

		this.openAIProvider = createOpenAI( {
			apiKey: openAIToken,
		} );

		this.octokit = github.getOctokit( githubApiToken );

		if ( firecrawlApiKey ) {
			this.firecrawlClient = new FirecrawlApp( { apiKey: firecrawlApiKey } );
		}

		this.prContext = {
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			number: Number( prNumber ),
		};
	}

	public async run(): Promise< void > {
		// Set overall execution timeout
		const executionTimeoutSeconds = Number( core.getInput( 'execution_timeout' ) ) || 600;
		const executionTimeoutMs = executionTimeoutSeconds * 1000;
		const executionTimeout = setTimeout( () => {
			throw new Error( `Execution timeout: Action exceeded ${ executionTimeoutSeconds } seconds` );
		}, executionTimeoutMs );

		try {
			const prInfo = await this.getPullRequestInfo(
				this.prContext.owner,
				this.prContext.repo,
				this.prContext.number
			);

			core.debug(
				`Pull Request Info (${ this.prContext.owner }/${ this.prContext.repo } - ${
					this.prContext.number
				}): ${ JSON.stringify( prInfo ) }`
			);

			const relatedDocs = await this.getRelatedDocsURLs( prInfo );
			if ( relatedDocs.length === 0 ) {
				core.info( 'No related documentation pages found for this PR.' );
				return;
			}

			core.info( 'Related documentation pages found:' );
			relatedDocs.forEach( doc =>
				core.info(
					`- ${ doc.url } (confidence: ${ doc.confidence } / ${
						doc.confidence >= this.confidenceThreshold ? 'relevant' : 'not relevant'
					})`
				)
			);

			const relevantRelatedDocs = relatedDocs.filter(
				doc => doc.confidence >= this.confidenceThreshold
			);

			const inconsistencies: Inconsistency[] = [];

			for ( const doc of relevantRelatedDocs ) {
				core.info( `Reviewing documentation page: ${ doc.url }` );

				const inconsistenciesForURL = await this.getInconsistenciesForURL( prInfo, doc.url );

				inconsistencies.push(
					...inconsistenciesForURL.filter( d => d.confidence >= this.confidenceThreshold )
				);
			}

			core.setOutput( 'jsonReport', JSON.stringify( inconsistencies, null, 2 ) );
			core.setOutput( 'markdownReport', this.buildPRComment( inconsistencies ) );

			if ( this.postComment ) {
				await this.postCommentIfNeeded( inconsistencies );
			}
		} finally {
			clearTimeout( executionTimeout );
		}
	}

	private buildPRComment( relevantInconsistencies: Inconsistency[] ) {
		const relevantInconsistenciesByURL = relevantInconsistencies.reduce( ( acc, obj ) => {
			acc[ obj.url ] ??= [];
			acc[ obj.url ].push( obj );
			return acc;
		}, {} as Record< string, Inconsistency[] > );

		let comment = '';

		Object.keys( relevantInconsistenciesByURL ).forEach( url => {
			comment += `#### Inconsistencies found in ${ url }\n`;

			relevantInconsistenciesByURL[ url ].forEach( inconsistency => {
				comment += `- **Inconsistency**: ${ inconsistency.inconsistency }\n`;
				comment += `  - **Suggested Fix**: ${ inconsistency.suggested_fix }\n`;
				comment += `  - **Severity**: ${ this.getSeverityEmoji( inconsistency.severity ) } ${
					inconsistency.severity
				}\n`;
			} );

			comment += '\n';
		} );

		if ( comment === '' ) {
			comment += '✅ No inconsistencies found in the documentation.';
		}

		const footer = `<details>
<summary>Details</summary>

* Report generated at \`${ new Date().toISOString() }\`
* Confidence threshold: \`${ this.confidenceThreshold }\`
* OpenAI Model: \`${ this.openAIModel }\`

</details>`;

		return `${ PR_COMMENT_HEADER }\n\n${ comment }\n\n${ footer }`;
	}

	private async postCommentIfNeeded( relevantInconsistencies: Inconsistency[] ) {
		if ( ! this.postComment ) {
			return;
		}

		const commentBody = this.buildPRComment( relevantInconsistencies );

		const existingCommentId = await this.findExistingBotComment();

		if ( existingCommentId ) {
			await this.octokit.rest.issues.deleteComment( {
				comment_id: existingCommentId,
				owner: this.prContext.owner,
				repo: this.prContext.repo,
			} );
		}

		await this.octokit.rest.issues.createComment( {
			issue_number: this.prContext.number,
			owner: this.prContext.owner,
			repo: this.prContext.repo,
			body: commentBody,
		} );
	}

	private async getInconsistenciesForURL(
		prInfo: PullRequestInfo,
		url: string
	): Promise< Inconsistency[] > {
		const docsPageContent = await this.getPageContentParsed( url );

		core.debug( `Parsed documentation content from ${ url }: ${ docsPageContent }` );

		const userPrompt =
			'Review the documentation content below for inaccuracies based on the provided Pull Request. Identify and report all inconsistencies.\n' +
			`<pull-request><title>${ prInfo.title }</title><description>${ prInfo.description }</description></pull-request>\n` +
			`<changes>\n${ prInfo.diff }\n</changes>\n\n\n` +
			`<documentation>
  <url>${ url }</url>
  <content>
    <![CDATA[
    ${ docsPageContent }
    ]]>
  </content>
</documentation>`;

		const result = await aiSDK.generateObject( {
			temperature: 0,
			model: this.openAIProvider.languageModel( this.openAIModel ),
			schema: z.object( {
				inconsistencies: z.array(
					z.object( {
						inconsistency: z
							.string()
							.min( 1 )
							.describe( 'A concise summary of the inconsistency found in the documentation' ),
						evidence_from_doc: z
							.string()
							.nullable()
							.describe(
								'The exact text snippet from the documentation that is now incorrect. Remove all the markdown formatting.'
							),
						suggested_fix: z
							.string()
							.min( 1 )
							.describe(
								'A clear, actionable suggestion on how to update the documentation to align with the PR.'
							),
						severity: z
							.enum( [ 'High', 'Medium', 'Low' ] )
							.describe(
								'The severity of the inconsistency based on its impact on users and the documentation quality'
							),
						confidence: z
							.number()
							.min( 0 )
							.max( 1 )
							.describe(
								'Your confidence level (0-1) that this is a legitimate inconsistency requiring attention'
							),
					} )
				),
			} ),
			system: technicalAccuracyReviewerPrompt,
			prompt: userPrompt,
		} );

		return ( result.object.inconsistencies ?? [] ).map( inconsistency => ( {
			...inconsistency,
			url,
		} ) );
	}

	private async getRelatedDocsURLs( prInfo: PullRequestInfo ): Promise< RelatedDocsURL[] > {
		const urls = await this.getURLs( this.url );

		core.info( `Found ${ urls.length } URLs to analyze from the sitemap or file.` );

		const userPrompt =
			'Analyze the following Pull Request and sitemap to identify relevant documentation URLs:\n' +
			`<pull-request><title>${ prInfo.title }</title><description>${ prInfo.description }</description></pull-request>\n` +
			`<changes><![CDATA[
    ${ prInfo.diff }
    ]]>
</changes>\n\n\n` +
			`<urls><![CDATA[
${ urls.map( url => `<url>${ url }</url>` ).join( '\n' ) }
    ]]></urls>`;

		const result = await aiSDK.generateObject( {
			temperature: 0,
			model: this.openAIProvider.languageModel( this.openAIModel ),
			schema: z.object( {
				urls: z.array(
					z.object( {
						url: z.string().url(),
						confidence: z.number().min( 0.0 ).max( 1.0 ),
					} )
				),
			} ),
			system: technicalContentUrlFinderPrompt,
			prompt: userPrompt,
		} );

		return result.object.urls;
	}

	private async getURLs( domain: string ) {
		if ( this.sitemapURL ) {
			return await this.getUrlsFromSitemap( this.sitemapURL );
		}

		if ( this.urlsFile ) {
			try {
				const fileContent = readFileSync( this.urlsFile, 'utf-8' );
				return fileContent
					.split( '\n' )
					.map( line => line.trim() )
					.filter( line => line.length > 0 && line.startsWith( 'http' ) );
			} catch ( error ) {
				throw new Error( `Error reading URLs file: ${ error }` );
			}
		}

		if ( ! this.firecrawlClient ) {
			throw new Error(
				'Firecrawl client not initialized. Please provide either sitemap_url, urls_file or firecrawl_api_key.'
			);
		}

		const mapResult = await this.firecrawlClient.mapUrl( domain, {
			includeSubdomains: true,
		} );

		if ( mapResult.error || ! mapResult.success ) {
			throw new Error( `Error mapping URL: ${ mapResult.error }` );
		}

		return mapResult.links ?? [];
	}

	private async getPullRequestInfo(
		owner: string,
		repo: string,
		prNumber: number
	): Promise< { title: string; description: string; diff: string } > {
		const { data: prInfo } = await this.octokit.rest.pulls.get( {
			owner,
			repo,
			pull_number: prNumber,
		} );

		const { data: diff } = await this.octokit.rest.pulls.get( {
			owner,
			repo,
			pull_number: prNumber,
			mediaType: {
				format: 'diff',
			},
		} );

		return {
			title: prInfo.title,
			description: prInfo.body ?? '',
			diff: diff as unknown as string,
		};
	}

	private async getPageContentParsed( url: string ) {
		const turndownService = new TurndownService();

		const controller = new AbortController();
		const timeoutId = setTimeout( () => controller.abort(), REQUEST_TIMEOUT );

		try {
			const response = await fetch( url, {
				signal: controller.signal,
				redirect: 'follow',
				headers: {
					'User-Agent': 'GitHub-Actions-Docs-Doctor/1.0',
				},
			} );

			if ( ! response.ok ) {
				throw new Error(
					`Failed to fetch documentation page: ${ response.status } ${ response.statusText }`
				);
			}

			const text = await response.text();
			return turndownService.turndown( text );
		} catch ( error ) {
			if ( error instanceof Error && error.name === 'AbortError' ) {
				throw new Error( `Request timeout while fetching: ${ url }` );
			}
			throw error;
		} finally {
			clearTimeout( timeoutId );
		}
	}

	private async findExistingBotComment(): Promise< number | null > {
		const comments = await this.octokit.rest.issues.listComments( {
			issue_number: this.prContext.number,
			owner: this.prContext.owner,
			repo: this.prContext.repo,
		} );

		const botComment = comments.data.find( comment =>
			comment.body?.startsWith( PR_COMMENT_HEADER )
		);

		return botComment ? botComment.id : null;
	}

	private async getUrlsFromSitemap( sitemapUrl: string ) {
		if ( ! this.isValidUrl( sitemapUrl ) ) {
			throw new Error( `Invalid sitemap URL: ${ sitemapUrl }` );
		}

		const controller = new AbortController();
		const timeoutId = setTimeout( () => controller.abort(), REQUEST_TIMEOUT );

		try {
			const response = await fetch( sitemapUrl, {
				signal: controller.signal,
				headers: {
					'User-Agent': 'GitHub-Actions-Docs-Doctor/1.0',
				},
			} );

			if ( ! response.ok ) {
				throw new Error( `Failed to fetch sitemap: ${ response.status } ${ response.statusText }` );
			}

			const xmlData = await response.text();

			const result = await xml2js.parseStringPromise( xmlData );

			const urls: string[] = [];
			if ( result.urlset?.url ) {
				result.urlset.url.forEach( ( entry: { loc: string[] } ) => {
					if ( entry.loc?.[ 0 ] ) {
						urls.push( entry.loc[ 0 ] );
					}
				} );
			} else if ( result.sitemapindex?.sitemap ) {
				for ( const sitemapEntry of result.sitemapindex.sitemap ) {
					if ( sitemapEntry.loc?.[ 0 ] ) {
						const nestedUrls = await this.getUrlsFromSitemap( sitemapEntry.loc[ 0 ] );
						urls.push( ...nestedUrls );
					}
				}
			}
			return urls;
		} catch ( error ) {
			if ( error instanceof Error && error.name === 'AbortError' ) {
				throw new Error( `Request timeout while fetching sitemap: ${ sitemapUrl }` );
			}
			throw error;
		} finally {
			clearTimeout( timeoutId );
		}
	}

	private isValidUrl( url: string ): boolean {
		try {
			const parsedUrl = new URL( url );
			// Only allow HTTP and HTTPS protocols
			return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
		} catch {
			return false;
		}
	}

	private getSeverityEmoji( severity: string ): string {
		switch ( severity ) {
			case 'High':
				return '🛑';
			case 'Medium':
				return '⚠️';
			case 'Low':
				return 'ℹ️';
			default:
				return '';
		}
	}
}
