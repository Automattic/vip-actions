# AI Changelog Generator

This action generates a changelog entry for a Pull Request using OpenAI's GPT models. It analyzes the PR content and automatically generates a concise, well-formatted changelog entry that can be used for release notes or documentation.

## Features

- Generates high-quality changelog entries based on PR content
- Automatically posts the generated changelog as a PR comment
- Restricts usage to users with write access to the repository
- Provides visual feedback with reactions to comment triggers
- Supports custom prompts for tailored changelog generation
- Flexible analysis options (diff, patch, or commits)
- Configurable OpenAI model selection

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
| `prompt`          | Override the prompt used for generating the changelog entry       | ❌       | -                                        |

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
    types:
      - created

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

### Advanced Usage with Custom Configuration

```yaml
name: Generate Changelog
on:
  issue_comment:
    types:
      - created

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
          model: gpt-4o
          analyze: commits
          pr_description: "Custom description for analysis"
          prompt: "Generate a concise changelog entry focusing on user-facing changes"
          post_comment: 'false'
      
      - name: Use generated changelog
        run: |
          echo "Generated changelog: ${{ steps.changelog.outputs.changelog_entry }}"
```

### Triggering the Action

Users with write access to the repository can trigger changelog generation by commenting on a pull request with a specific trigger phrase (commonly `/generate-changelog` or similar, depending on your workflow configuration).

## How It Works

1. **Trigger Recognition**: The action is triggered when a user with appropriate permissions comments on a pull request
2. **Access Control**: It verifies that the user has write, maintain, or admin access to the repository
3. **Acknowledgment**: Provides immediate feedback with an "eyes" reaction on the triggering comment
4. **Analysis**: Uses the specified OpenAI model to analyze the PR content (diff, patch, or commits)
5. **Generation**: Generates a structured changelog entry based on the analysis
6. **Output**: Either posts the changelog as a comment or makes it available as an output for other steps
7. **Feedback**: Provides success ("hooray") or failure ("-1") reactions on the original comment

## Analysis Options

The `analyze` input parameter supports three different modes:

- **`diff`** (default): Analyzes the unified diff of changes in the PR
- **`patch`**: Analyzes the patch format of the changes
- **`commits`**: Analyzes individual commit messages and changes

## Security & Permissions

- **API Key Security**: Requires an OpenAI API key stored as a repository secret
- **Access Control**: Only users with write, maintain, or admin permissions can trigger the action
- **Token Permissions**: The GitHub token needs `contents: read` and `pull-requests: write` permissions
- **Rate Limiting**: Subject to OpenAI API rate limits and GitHub API rate limits

## Error Handling

The action includes comprehensive error handling:
- Failed authorization results in a failure status and "-1" reaction
- API failures are caught and reported through comment reactions
- Missing required inputs result in clear error messages

## Configuration Tips

1. **Model Selection**: `gpt-4.1` is the default, but you can use other models like `gpt-4o` or `gpt-3.5-turbo` based on your needs
2. **Custom Prompts**: Use the `prompt` input to tailor the changelog format to your project's style
3. **Analysis Mode**: Choose `commits` for commit-message-based analysis or `diff` for code-change-based analysis
4. **Silent Mode**: Set `post_comment: 'false'` to generate changelog entries without posting them as comments
