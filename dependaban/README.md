# Dependaban

This action checks for NPM dependencies that rely on install scripts and fails if any are present. By running this action on pull requests, projects can use `npm install --ignore-scripts` with confidence. It uses [`can-i-ignore-scripts`](https://github.com/naugtur/can-i-ignore-scripts) under the hood.

## Why is this useful?

NPM packages can use scripts like `preinstall` and `postinstall` to run arbitrary code (huge security risk!) or build binaries that work on one computer but not on another (not portable!).

## Inputs

- `skip-scripts-check`: Set to `"true"` to disable the check. Default: `"false"`
- `node-version`: Node.js version used to run the check. Default: `"26"`. Avoid aliases such as `lts/*` on GitHub Enterprise Server: setup-node resolves them through an unauthenticated GitHub API call that hits the shared runner IP's rate limit.

## Example

```yaml
name: My Workflow
on:
  pull_request:
  push:
    branches:
      - trunk
  workflow_dispatch:

jobs:
  dependaban:
    name: Dependaban
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: Automattic/vip-actions/dependaban@trunk
```
