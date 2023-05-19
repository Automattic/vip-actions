# JUnit NewRelic Processor

A Github Action to process Junit XML results and push them to NewRelic with as a custom event "TestRun".

NewRelic already has an inbuilt method to push "TestRun" custom event. The CLI method to do it is `newrelic reporting junit --path <testResults.XML>`. However, once the test results are pushed into NewRelic, they do not have any association with the source or the event that triggered those test cases.

This action makes a few changes to the results XML file before feeding it to NewRelic to maintain the relationship between CI Event and the Tests that were executed during workflow.

## Inputs

| Key                 | Required | Default | Description |
| ------------------- | -------- | ------- | ----------- |
| `accountId`         | **yes**  | -       | The account to post test run results to. This could also be a subaccount. |
| `region`            | no       | US      | The region the account belongs to. |
| `ingestLicenseKey` | **yes**  | -       | Your New Relic [License key](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/) used for data ingest. |
| `testOutputPath`    | **yes**  | -       | The path to the JUnit output file. |
| `ghEventType`    | **no**  | ${{ github.event_name }}       | Type of event that triggered workflow. |
| `ghEventBranchName`    | **no**  | ${{ github.ref }}       | Name of branch that triggered the workflow. |

## Processing
The `ghEventType` and `ghEventBranchName` are added to each test case in the junit xml file as "attributes". These attributes are saved in NewRelic as the columns in the event data and they can be used to query the results and build dashboard for test observability in the CI systems.

## Credit
This action is heavily inspired by New Relic's own action: https://github.com/newrelic/junit-reporter-action/blob/main/README.md