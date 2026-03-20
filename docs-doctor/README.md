# Docs Doctor

A GitHub Action that analyzes Pull Requests for documentation inconsistencies and gaps using [Claude](https://www.anthropic.com/claude) via [claude-code-action](https://github.com/anthropics/claude-code-action).

## Features

- Searches the documentation site to find pages affected by PR changes
- Detects inconsistencies between code changes and existing documentation
- Identifies missing documentation for new features
- Classifies findings by severity (Breaking, Outdated, Gap)
- Posts findings as a PR comment with sticky comment support (updates on re-runs)
- Silently skips PRs with no user-facing changes

## Inputs

| Name | Description | Required | Default |
|------|-------------|:--------:|---------|
| `anthropic_api_key` | Anthropic API key for Claude | Yes | - |
| `docs_search_url` | Base URL for the docs site search | No | `https://docs.wpvip.com/?s=` |
| `max_turns` | Maximum number of agentic turns Claude can take | No | `20` |
| `model` | Claude model to use | No | `claude-sonnet-4-6` |
| `pr_number` | Pull request number to analyze | No | `${{ github.event.pull_request.number }}` |
| `github_token` | GitHub token for API operations. If provided, skips OIDC auth (no Claude Code app needed) | No | - |
| `show_full_output` | Show Claude's full turn-by-turn output in logs. Only enable in private repos | No | `false` |
| `post_comment` | Whether to post the report as a PR comment | No | `true` |
| `extra_prompt` | Additional instructions appended to the prompt | No | - |

## Usage

### Basic Usage

```yaml
name: Docs Doctor
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  pull-requests: write
  contents: read
  id-token: write

jobs:
  docs-doctor:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1

      - uses: Automattic/vip-actions/docs-doctor@trunk
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### With Custom GitHub Token (No Claude Code App Required)

If you don't want to install the [Claude Code GitHub App](https://github.com/apps/claude), pass a `github_token` to skip OIDC authentication:

```yaml
- uses: Automattic/vip-actions/docs-doctor@trunk
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

When using `github_token`, the `id-token: write` permission is not needed.

### Label-Triggered (Run Only When Labeled)

```yaml
name: Docs Doctor Test
on:
  pull_request:
    types: [opened, reopened, labeled, synchronize, edited]

permissions:
  pull-requests: write
  contents: read

jobs:
  docs-doctor:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    if: contains(join(github.event.pull_request.labels.*.name, ','), 'docs')
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: Automattic/vip-actions/docs-doctor@trunk
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## How It Works

1. **PR Analysis**: Reads the PR title, description, and diff to understand what changed
2. **Documentation Search**: Generates 3 targeted search queries and searches the docs site to find relevant pages
3. **Inconsistency Detection**: Fetches the top 5 most relevant pages and cross-references their content against the PR changes
4. **Missing Docs Check**: Identifies new features or concepts that lack documentation
5. **Report**: Writes findings to a file and posts them as a PR comment (with sticky comment support)

If no documentation impact is detected, the action completes silently without posting a comment.

## Report Format

The report classifies findings by severity:

- **Breaking**: Users will hit errors or wrong behavior following current docs
- **Outdated**: Docs mention old names/values but the intent is still clear
- **Gap**: New feature lacks documentation but existing docs aren't wrong

Each finding includes the affected URL, the specific text that is outdated, and what it should say.

## Security & Permissions

- **API Key**: Store the Anthropic API key as a repository secret (`ANTHROPIC_API_KEY`)
- **Minimal Tool Access**: Claude only has access to `Read`, `Write`, `WebFetch`, and read-only `gh pr` commands. It cannot execute arbitrary shell commands, push code, or modify the repository
- **Token Permissions**: Requires `pull-requests: write` and `contents: read`. Add `id-token: write` if not using a custom `github_token`
- **Authentication**: Two options:
  - **OIDC (default)**: Authenticates as `claude[bot]` via the Claude Code GitHub App. Requires `id-token: write` and the app installed on the repo
  - **Custom token**: Pass `github_token` to skip OIDC entirely. No app installation needed
