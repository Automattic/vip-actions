# VIP GitHub Actions

A collection of GitHub Actions meant to be reused by multiple VIP projects.

## Available actions

- **Changelog:** Retrieves changelog data from the last closed Pull Request and publishes a changelog post to a given endpoint. [More info](changelog/README.md)
- **Dependaban:** Ban the use of dependencies that rely on pre- or post-install scripts. [More info](dependaban/README.md)
- **Dependabot auto-merge:** Automatically merges Dependabot PRs if tests pass. [More info](dependabot-auto-merge/README.md)
- **Node.js setup**: Reduces boilerplate in your action by performing Node.js setup and installing dependencies consistently. [More info](nodejs-setup/README.md)
- **npm publish:** Automate the validation, testion, and publishing steps for a new npm release. [More info](npm-publish/README.md)
- **Stalebot:** Automatically closes stale issues and pull requests. [More info](stale/README.md)
