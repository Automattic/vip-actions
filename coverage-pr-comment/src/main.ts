import * as github from '@actions/github'
import * as core from '@actions/core'
import { getMarkdownReport } from './report'

export async function run(): Promise<void> {
  try {
    const textCoverageReportPath: string = core.getInput('textReportPath')
    const srcBasePath: string = core.getInput('srcBasePath')
    const { sha, serverUrl } = github.context
    const { repo: repository, owner } = github.context.repo

    if (!sha) {
      core.error('Can`t detect commit SHA')
    }
    if (!sha) {
      core.error('Can`t detect serverUrl')
    }
    if (!repository) {
      core.error('Can`t detect repo url')
    }
    if (!owner) {
      core.error('Can`t detect owner url')
    }
    const githubBaseUrl = `${serverUrl}/${owner}/${repository}/blob/${sha}`
    core.debug(`githubBaseUrl: ${githubBaseUrl}`)
    const mdReport = await getMarkdownReport({
      pathToTextReport: textCoverageReportPath,
      githubBaseUrl,
      srcBasePath
    })
    core.setOutput('markdownReport', mdReport)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(String(error))
    }
  }
}
