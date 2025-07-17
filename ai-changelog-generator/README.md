# AI Changelog Generator

This action generates a changelog entry for a Pull Request using OpenAI's GPT models. It analyzes the PR content and automatically generates a concise, well-formatted changelog entry that can be used for release notes or documentation.

## Features

- Generates high-quality changelog entries based on PR content
- Automatically posts the generated changelog as a PR comment
- Restricts usage to users with write access to the repository
- Provides visual feedback with reactions to comment triggers

## Inputs

| Name              | Description                                                       | Required | Default                                  |
|-------------------|-------------------------------------------------------------------|:--------:|------------------------------------------|
| `pr_number`       | The pull request number to generate a changelog entry for         | ❌       | `${{ github.event.issue.number }}`       |
| `comment_id`      | The ID of the comment that triggered the request                  | ❌       | `${{ github.event.comment.id }}`         |
| `token`           | The GitHub token for authentication                               | ❌       | `${{ github.token }}`                    |
| `openai_api_key`  | OpenAI API key for authentication                                 | ✅       | -                                        |
| `analyze`         | What to analyze (diff, patch, commits)                            | ❌       | `diff`                                   |
| `model`           | The OpenAI model to use for generating the changelog entry        | ❌       | `gpt-4.1`                                |
| `pr_description`  | The description to use instead of the original PR description     | ❌       | -                                        |
| `user_login`      | The GitHub username of the user who requested the changelog entry | ❌       | `${{ github.event.comment.user.login }}` |
| `post_comment`    | Whether to post the generated changelog entry as a comment        | ❌       | `true`                                   |

## Outputs

| Name              | Description                       |
|-------------------|-----------------------------------|
| `changelog_entry` | The generated changelog entry     |

## Usage

### Basic Usage in a Workflow

```yaml
name: Generate Changelog
on:
  issue_comment:
    types: [created]

jobs:
  generate-changelog:
    if: ${{ github.event.issue.pull_request && contains(github.event.comment.body, '/generate-changelog') }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Generate Changelog Entry
        uses: Automattic/vip-actions/ai-changelog-generator@trunk
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
```

## How It Works

1. When triggered, the action acknowledges the request with an "eyes" reaction
2. It checks if the user who triggered the action has write access to the repository
3. It uses OpenAI's API to analyze the PR content and generate a changelog entry
4. If configured to post a comment, it either creates a new comment or updates an existing one
5. It provides feedback on success or failure using reactions to the triggering comment

## Security

This action requires an OpenAI API key and should be used with appropriate secrets management. Access is restricted to users with write permissions to the repository.
