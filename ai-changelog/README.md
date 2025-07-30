# AI Changelog

This action generates a changelog entry for a Pull Request using OpenAI's GPT models. It analyzes the PR content and generates a concise, well-formatted changelog entry that can be used programmatically in workflows for release notes or documentation.

## Features

- Generates high-quality changelog entries based on PR content
- Direct programmatic usage without comment-based triggering
- Flexible analysis options (diff, patch, or commits)
- Configurable OpenAI model selection
- Automatic fallback to commits analysis if initial analysis fails
- Designed for non-technical, user-facing changelog entries

## Inputs

| Name              | Description                                                       | Required | Default                                  |
|-------------------|-------------------------------------------------------------------|:--------:|------------------------------------------|
| `pr_number`       | The pull request number to generate a changelog entry for         | ✅       | -                                        |
| `token`           | The GitHub token for authentication                               | ❌       | `${{ github.token }}`                    |
| `openai_api_key`  | OpenAI API key for authentication                                 | ✅       | -                                        |
| `analyze`         | What to analyze (diff, patch, commits)                            | ❌       | `diff`                                   |
| `model`           | The OpenAI model to use for generating the changelog entry        | ❌       | `gpt-4.1`                                |
| `pr_description`  | The description to use instead of the original PR description     | ❌       | -                                        |

## Outputs

| Name              | Description                       |
|-------------------|-----------------------------------|
| `changelog_entry` | The generated changelog entry     |

## Usage

### Basic Usage in a Workflow

```yaml
name: Generate Changelog Entry
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  generate-changelog:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - name: Generate Changelog Entry
        id: changelog
        uses: Automattic/vip-actions/ai-changelog@trunk
        with:
          pr_number: ${{ github.event.pull_request.number }}
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Use Generated Changelog
        run: |
          echo "Generated changelog entry:"
          echo "${{ steps.changelog.outputs.changelog_entry }}"
```

### Advanced Usage with Custom Configuration

```yaml
name: Generate Changelog Entry
on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to generate changelog for'
        required: true
        type: number

jobs:
  generate-changelog:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - name: Generate Changelog Entry
        id: changelog
        uses: Automattic/vip-actions/ai-changelog@trunk
        with:
          pr_number: ${{ inputs.pr_number }}
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          model: gpt-4o
          analyze: commits
          pr_description: "Custom description for analysis"
      
      - name: Save to file
        run: |
          echo "${{ steps.changelog.outputs.changelog_entry }}" >> changelog.md
      
      - name: Upload changelog
        uses: actions/upload-artifact@v4
        with:
          name: changelog-entry
          path: changelog.md
```

### Integration with Release Workflow

```yaml
name: Create Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Get PR number from merge commit
        id: pr
        run: |
          PR_NUMBER=$(gh pr list --state merged --head ${{ github.ref_name }} --json number --jq '.[0].number')
          echo "number=$PR_NUMBER" >> $GITHUB_OUTPUT
        env:
          GH_TOKEN: ${{ github.token }}
      
      - name: Generate Changelog Entry
        id: changelog
        if: steps.pr.outputs.number
        uses: Automattic/vip-actions/ai-changelog@trunk
        with:
          pr_number: ${{ steps.pr.outputs.number }}
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ github.token }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: ${{ steps.changelog.outputs.changelog_entry }}
```

## How It Works

1. **Input Validation**: Validates the PR number, tokens, and analysis method
2. **PR Data Retrieval**: Fetches PR title, description, and content based on the analysis method
3. **Content Analysis**: Analyzes the specified content (diff, patch, or commits)
4. **AI Generation**: Uses OpenAI to generate a user-friendly changelog entry
5. **Fallback Mechanism**: If the initial analysis fails, automatically retries with commits analysis
6. **Output**: Returns the generated changelog entry for use in subsequent workflow steps

## Analysis Options

The `analyze` input parameter supports three different modes:

- **`diff`** (default): Analyzes the unified diff of changes in the PR
- **`patch`**: Analyzes the patch format of the changes  
- **`commits`**: Analyzes individual commit messages and changes

The action automatically falls back to `commits` analysis if the initial method doesn't produce results.

## Changelog Entry Style

The generated changelog entries are optimized for:
- **Non-technical audience**: Uses clear, accessible language
- **User-focused**: Emphasizes visible impact rather than implementation details
- **Concise format**: 1-2 short sentences in Markdown list format
- **Present tense**: Uses active voice and present tense
- **Consistency**: Follows a standardized style across all entries

## Security & Configuration

- **API Key Security**: Requires an OpenAI API key stored as a repository secret
- **Token Permissions**: The GitHub token needs `contents: read` and `pull-requests: read` permissions
- **Rate Limiting**: Subject to OpenAI API rate limits and GitHub API rate limits
- **Model Selection**: Supports various OpenAI models; `gpt-4.1` is default for quality

## Error Handling

The action includes comprehensive error handling:
- Input validation for PR numbers and required parameters
- API error handling with clear error messages
- Automatic fallback to commits analysis if primary method fails
- Warning messages for empty responses from OpenAI
