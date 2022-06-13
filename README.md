# VIP GitHub Actions

A collection of GitHub Actions meant to be reused by multiple VIP projects.

## Available Actions

### Changelog

Retrieves changelog data from the last closed Pull Request and publishes a changelog post to a given endpoint. By default it will post to https://vipinternalchangelog.wordpress.com when no endpoint is provided.

For more info about the tool it uses under the hood, see: https://github.com/Automattic/vip-build-tools/#script-changelog

#### Example

```yaml
---

name: My Workflow
on:
  push:
    branches:
      - master

jobs:
  changelog:
    name: Changelog
    needs: [deploy]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: Automattic/vip-actions@v1
        with:
          endpoint-token: ${{ secrets.CHANGELOG_POST_TOKEN }}
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```
