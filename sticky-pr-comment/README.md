# Sticky PR comment

This is a copy of an MIT-licensed community GitHub Action that formats a comment to a pull request. The original action can be found at [marocchino/sticky-pull-request-comment](https://github.com/marocchino/sticky-pull-request-comment/tree/v2.9.0). Since GitHub Actions gain read access to our private repositories, making a copy ensures that we can audit changes and not expose ourselves to potential supply-chain attacks against the community repository.

## Usage

Raw message:

```yaml
steps:
  - name: Post PR comment
    uses: Automattic/vip-actions/sticky-pr-comment@trunk
    with:
      header: my-comment-name
      message: |
        ## Important
        This is a very important message.
```

From file:

```yaml
steps:
  - name: Post PR comment
    uses: Automattic/vip-actions/sticky-pr-comment@trunk
    with:
      header: my-comment-name
      path: path/to/comment.md
```
