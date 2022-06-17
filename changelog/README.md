# Changelog

This action retrieves changelog data from the last closed pull request and publishes a changelog post to the given endpoint. By default, it will post to https://vipinternalchangelog.wordpress.com.

For more info about the tool it uses under the hood, see: https://github.com/Automattic/vip-build-tools/#script-changelog

## Inputs

  * `endpoint`: the endpoint to post the changelog; `https://public-api.wordpress.com/wp/v2/sites/vipinternalchangelog.wordpress.com/posts` by default;
  * `endpoint-token`: the WordPress token required to post to the given `endpoint`. **Required**.
  * `repo-token`: the GitHub token required to retrieve pull requests. By default, `github.token` is used. Please make sure that the provided token has the `pull-requests: read` permission.
  * `status`: the status of the post to be published. Can be either `publish` (the default) or `draft`.
  * `tag-id`: the ID of a tag to be added to the post, empty by default. Can be a comma-separated list of tag IDs.
  * `link-to-pr`: whether to add a link to the pull request to the changelog post, `false` by default.

#### Example

```yaml
name: My Workflow
on:
  push:
    branches:
      - master

jobs:
  changelog:
    name: Changelog
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    steps:
      - uses: Automattic/vip-actions/changelog@v1
        with:
          endpoint-token: ${{ secrets.CHANGELOG_POST_TOKEN }}
          link-to-pr: 'true'
```
