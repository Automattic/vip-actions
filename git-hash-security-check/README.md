# Git Dependency Security

This project implements automatic security checks to prevent git short hash collision attacks in dependencies.

## Git Hash Collision Protection

**Issue**: Short git commit hashes (7-12 characters) in dependencies are vulnerable to collision attacks where:

- Attackers can create commits with the same short hash prefix
- This causes GitHub to return "ambiguous short SHA" errors
- Breaking builds and potentially enabling supply chain attacks

**Solution**: We enforce the use of full 40-character commit hashes for all git dependencies.

## Automated Checks

Our CI pipeline automatically validates that:

- All `github:` dependencies in `package.json` use full 40-character hashes
- The `npm-shrinkwrap.json` file doesn't contain short git hashes
- No collision-vulnerable dependencies are introduced

## Example

❌ **Vulnerable** (7-character hash):

```json
"lando": "github:org/repo#abcdefg"
```

✅ **Secure** (40-character hash):

```json
"lando": "github:org/repo#abcdef1234567890abcdef1234567890abcdef1234567890"
```
