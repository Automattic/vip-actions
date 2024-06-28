# Swagger Verification

This action loads the the URL for the Swagger JSON endpoint of a service. It verifies that the Swagger specification doesn't have any errors.

The service should be running in CI prior to running this action so that the action can load the URL.

## Inputs

- `swagger-json-url`: Required - URL to the JSON version of the Swagger spec for the service. This is oftentimes found at `{local-url}/swagger-json`


## Example

```yaml
name: Swagger Validation


jobs:
  swagger:
    name: Swagger Validation
    runs-on: ubuntu-latest
    steps:
      - name: Run Service
        run: docker-compose up
      - uses: Automattic/vip-actions/swagger-validator@trunk
        with:
          swagger-json-url: "http://localhost:2999/docs-json"
```