# Changed Files Detector

A GitHub Action that detects changed files in a repository and determines whether to proceed with CI based on allow or deny patterns. This action helps you optimize your CI workflow by skipping unnecessary builds when only certain files have changed.

## Description

This action analyzes the files changed in a pull request or push and determines whether your CI workflow should proceed or be skipped based on configurable file patterns. It supports two modes:

- **Allow mode**: Skip CI if *only* files matching the specified patterns have changed
- **Deny mode**: Skip CI if *none* of the files matching the specified patterns have changed

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `mode` | Mode of operation: `allow` or `deny` | No | `allow` |
| `files` | Comma-separated list of file patterns to allow or deny | Yes | N/A |
| `fetch-depth` | Number of commits to fetch | No | `0` |

### Mode Explanation

#### Allow Mode

In **allow mode**, the action checks if *all* changed files match the specified patterns. If they do, the CI will be skipped. This is useful when:

- You want to skip CI for documentation-only changes
- You want to avoid running tests when only configuration files are modified
- You want to prevent CI from running when only workflow files are changed

For example, if you set `files: '*.md,docs/**,.github/workflows/**'` in allow mode:
- If only markdown files and workflow files are changed, CI will be skipped
- If any source code file is changed (along with docs), CI will proceed

#### Deny Mode

In **deny mode**, the action checks if *any* changed files match the specified patterns. If at least one file matches, the CI will proceed. This is useful when:

- You want to run CI only when specific file types are changed
- You want to trigger builds only when files in certain directories are modified
- You want to ensure tests run when core functionality changes

For example, if you set `files: 'src/**,lib/**,*.js'` in deny mode:
- If any JavaScript file or file in src/ or lib/ directories is changed, CI will proceed
- If only documentation, configuration, or other non-source files are changed, CI will be skipped

## Outputs

| Output | Description |
|--------|-------------|
| `any_changed` | Boolean indicating if any files matching the patterns have changed |
| `all_changed_files` | Comma-separated list of all changed files |
| `should_skip` | Boolean indicating if CI should be skipped based on the mode and changed files |

## Usage

#### Example: Allow Mode

Skip CI when only documentation or workflow files have changed:

```
name: CI
on: [pull_request]

jobs:
  check_changes:
    runs-on: ubuntu-latest
    outputs:
      should_skip: ${{ steps.changed_files.outputs.should_skip }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for allowed changes
        id: changed_files
        uses: Automattic/vip-actions/changed-files-detector@trunk
        with:
          mode: 'allow'
          files: '*.md,docs/**,.github/workflows/**'

  build_and_test:
    needs: check_changes
    if: needs.check_changes.outputs.should_skip != 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test
        run: |
          echo "Running build and tests..."
          # Your build commands here
```

#### Example: Deny Mode

Skip CI when no source code files have changed:

```
name: CI
on: [pull_request]

jobs:
  check_changes:
    runs-on: ubuntu-latest
    outputs:
      should_skip: ${{ steps.changed_files.outputs.should_skip }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for source code changes
        id: changed_files
        uses: Automattic/vip-actions/changed-files-detector@trunk
        with:
          mode: 'deny'
          files: 'src/**,lib/**,*.go,*.js,*.ts'

  build_and_test:
    needs: check_changes
    if: needs.check_changes.outputs.should_skip != 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test
        run: |
          echo "Running build and tests..."
          # Your build commands here
```

## Advanced Example: Conditional Jobs

You can use this action to conditionally run different jobs based on which files have changed:

```
name: CI
on: [pull_request]

jobs:
  check_changes:
    runs-on: ubuntu-latest
    outputs:
      frontend_changed: ${{ steps.check_frontend.outputs.any_changed }}
      backend_changed: ${{ steps.check_backend.outputs.any_changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check frontend changes
        id: check_frontend
        uses: Automattic/vip-actions/changed-files-detector@trunk
        with:
          mode: 'deny'
          files: 'frontend/**,*.js,*.ts,*.css'

      - name: Check backend changes
        id: check_backend
        uses: Automattic/vip-actions/changed-files-detector@trunk
        with:
          mode: 'deny'
          files: 'backend/**,*.go,*.py,*.java'

  frontend_tests:
    needs: check_changes
    if: needs.check_changes.outputs.frontend_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run frontend tests
        run: echo "Running frontend tests..."

  backend_tests:
    needs: check_changes
    if: needs.check_changes.outputs.backend_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: echo "Running backend tests..."
```

## Pattern Matching

The action uses bash glob pattern matching for file paths. Some examples:

- `*.md` - Match all markdown files in the root directory
- `docs/**` - Match all files in the docs directory and its subdirectories
- `src/*.js` - Match all JavaScript files in the src directory
- `**/*.test.js` - Match all JavaScript test files in any directory
