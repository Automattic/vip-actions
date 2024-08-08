# Code coverage PR comment

This is a copy of an MIT-licensed community GitHub Action that formats a code coverage report as a markdown comment. The original action can be found at [fingerprintjs/action-coverage-report-md](https://github.com/fingerprintjs/action-coverage-report-md/tree/v2.0.1). Since GitHub Actions gain read access to our private repositories, making a copy ensures that we can audit changes and not expose ourselves to potential supply-chain attacks against the community repository.

The report will look like this:


St|File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--|--------------------|---------|----------|---------|---------|-------------------
🟡|All files           |   70.58 |    72.22 |   83.33 |   71.42 |
🟡|&nbsp;src|   63.23 |    64.28 |      80 |   64.17 |
🔴|&nbsp;&nbsp;[main.ts](https://github.com/fingerprintjs/action-coverage-report-md/blob/80148ef2d10c51d31e3a472c61ce2ead8b68a2e1/src/main.ts)|       0 |        0 |       0 |       0 |[1-37](https://github.com/fingerprintjs/action-coverage-report-md/blob/80148ef2d10c51d31e3a472c61ce2ead8b68a2e1/src/main.ts#L1-L37)
🟢|&nbsp;&nbsp;[report.ts](https://github.com/fingerprintjs/action-coverage-report-md/blob/80148ef2d10c51d31e3a472c61ce2ead8b68a2e1/src/report.ts)|   95.55 |      100 |   88.88 |   95.55 |[14-15](https://github.com/fingerprintjs/action-coverage-report-md/blob/80148ef2d10c51d31e3a472c61ce2ead8b68a2e1/src/report.ts#L14-L15)
🟢|&nbsp;src/utils|     100 |      100 |     100 |     100 |
🟢|&nbsp;&nbsp;[getReportParts.ts](https://github.com/fingerprintjs/action-coverage-report-md/blob/80148ef2d10c51d31e3a472c61ce2ead8b68a2e1/src/utils/getReportParts.ts)|     100 |      100 |     100 |     100 |
🟢|&nbsp;&nbsp;[status.ts](https://github.com/fingerprintjs/action-coverage-report-md/blob/80148ef2d10c51d31e3a472c61ce2ead8b68a2e1/src/utils/status.ts)|     100 |      100 |     100 |     100 |

## Usage

> **Note**
> This package isn’t part of our core product. It’s kindly shared “as-is” without any guaranteed level of support from Fingerprint. We warmly welcome community contributions.

## Usage

Combine this action with the `sticky-pr-comment` action to post a code coverage report to a pull request:

```yaml
steps:
  - name: Prepare coverage report in markdown
    uses: Automattic/vip-actions/coverage-pr-comment@trunk
    id: coverage
    with:
      textReportPath: './coverage/coverage.txt'

  - name: Post coverage comment when coverage exists
    uses: Automattic/vip-actions/sticky-pr-comment@trunk
    with:
      header: code-coverage
      message: ${{ steps.coverage.outputs.markdownReport }}
```
