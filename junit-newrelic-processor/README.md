# JUnit NewRelic Processor

A Github Action to process Junit XML results and push them to NewRelic with as a custom event "TestRun".

NewRelic already has an inbuilt method to push "TestRun" custom event. The CLI method to do it is `newrelic reporting junit --path <testResults.XML>`. However, once the test results are pushed into NewRelic, they do not have any association with the source or the event that triggered those test cases.

This action makes a few changes to the results XML file before feeding it to NewRelic to maintain the relationship between CI Event and the Tests that were executed during workflow.

## Inputs

| Key  | Required | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| NEW_RELIC_INGEST_LICENSE_KEY  | Yes  | None  | Your New Relic Ingest License key.  |
| NEW_RELIC_ACCOUNT_ID  | Yes  | None  | Your New Relic account ID. Custom events representing your test run will be posted to this account.  |
| NEW_RELIC_REGION  | No  | US  | The geographical region for your New Relic account - US or EU. Default: US  |
| NEW_RELIC_TEST_OUTPUT_PATH  | Yes  | None  | The path to the JUnit output file.  |
| GITHUB_EVENT_TYPE  | No  | `github.event.name`  | The GitHub event type that triggered the workflow, eg., pull_request, push. Default: github.event_name  |
| GITHUB_EVENT_BRANCH  | No  | `github.ref_name`  | The branch name for the GitHub event that triggered the workflow. Default: github.ref_name  |
| GITHUB_REPOSITORY  | No  | `github.repository`  | Name of organisation and repo of the project in the format `organisation/repository`  |
| GITHUB_SHA  | No  | Commit that triggered the test run  | `github.sha`  |
| GITHUB_PR_NUMBER  | No  | `github.event.number`  | Pull request number  |

## Processing
The above mentioned attributes are added to the standard JUNIT XML file to create correlation between the test run and the CI before they are pushed to New Relic.

## Credit
This action is heavily inspired by New Relic's own action: https://github.com/newrelic/junit-reporter-action/blob/main/README.md