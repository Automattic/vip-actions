# 🛡️ Git Hash Security Check

**Preventing Short Hash Collision Attacks in Package Dependencies**

This GitHub Action implements automatic security checks to prevent git short hash collision attacks in dependencies across multiple platforms and protocols.

---

## 🚨 The Security Issue

<div style="display: flex; gap: 20px; margin: 20px 0;">
  <div style="flex: 1; border: 2px solid #e74c3c; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #ffebee 0%, #fff5f5 100%);">
    <h3 style="color: #c62828; margin-top: 0;">❌ VULNERABLE Dependencies</h3>
    <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; font-size: 12px; overflow-x: auto;">
{
  "dependencies": {
    "vue-lib": "<span style='color: #f39c12;'>github:user/vue-lib</span>#<span style='background: rgba(231,76,60,0.3); color: #e74c3c; padding: 2px 4px; border-radius: 3px;'>a1b2c3d</span>",
    "react-utils": "<span style='color: #f39c12;'>git+https://github.com/user/react.git</span>#<span style='background: rgba(231,76,60,0.3); color: #e74c3c; padding: 2px 4px; border-radius: 3px;'>ef4567a</span>"
  }
}
    </pre>
    <div style="color: black; background: rgba(231,76,60,0.1); border-left: 4px solid #e74c3c; padding: 10px; margin-top: 10px; font-size: 14px;">
      <strong>🚨 SECURITY RISK:</strong> Short hashes enable collision attacks!
    </div>
  </div>

  <div style="flex: 1; border: 2px solid #27ae60; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);">
    <h3 style="color: #2e7d32; margin-top: 0;">✅ SECURE Dependencies</h3>
    <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; font-size: 12px; overflow-x: auto;">
{
  "dependencies": {
    "vue-lib": "<span style='color: #f39c12;'>github:user/vue-lib</span>#<span style='background: rgba(39,174,96,0.3); color: #27ae60; padding: 2px 4px; border-radius: 3px;'>a1b2c3d4e5f6789012345678901234567890abcd</span>",
    "react-utils": "<span style='color: #f39c12;'>git+https://github.com/user/react.git</span>#<span style='background: rgba(39,174,96,0.3); color: #27ae60; padding: 2px 4px; border-radius: 3px;'>ef4567a8901234567890123456789012345678ef</span>"
  }
}
    </pre>
    <div style="color: black; background: rgba(39,174,96,0.1); border-left: 4px solid #27ae60; padding: 10px; margin-top: 10px; font-size: 14px;">
      <strong>🎉 SECURE:</strong> Full 40-character hashes prevent collisions!
    </div>
  </div>
</div>

<div style="text-align: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6; color: black;">
  <strong>🔍 The difference:</strong> 
  <span style="background: #ffebee; color: #c62828; padding: 4px 8px; border-radius: 4px; margin: 0 5px;">7 chars = vulnerable</span>
  vs 
  <span style="background: #e8f5e8; color: #2e7d32; padding: 4px 8px; border-radius: 4px; margin: 0 5px;">40 chars = secure</span>
</div>

**Problem**: Short git commit hashes (7-39 characters) in dependencies are vulnerable to collision attacks where:

- 🎯 **Attackers can create commits with the same short hash prefix**
- 💥 **This causes "ambiguous short SHA" errors on git platforms**
- 🔗 **Breaking builds and potentially enabling supply chain attacks**
- 📦 **Compromising package integrity and reproducible builds**

**Solution**: We enforce the use of full 40-character commit hashes for all git dependencies.

---

## 🔍 Comprehensive Platform Support

This action validates dependencies across all major git platforms and protocols:

| Platform | Supported Formats | Status |
|----------|------------------|---------|
| 🐙 **GitHub** | `github:`, `git+https://github.com` | ✅ Supported |
| 🦊 **GitLab** | `gitlab:`, `git+https://gitlab.com` | ✅ Supported |
| 🪣 **Bitbucket** | `bitbucket:`, `git+https://bitbucket.org` | ✅ Supported |
| 🔒 **SSH Protocol** | `git+ssh://` | ✅ Supported |
| 📦 **Shrinkwrap** | `npm-shrinkwrap.json` validation | ✅ Supported |

---

## 📋 Examples

### ❌ **VULNERABLE Dependencies**

```json
{
  "name": "my-app",
  "dependencies": {
    "vue-lib": "github:user/vue-lib#a1b2c3d",
    "react-utils": "git+https://github.com/user/react-utils.git#ef4567a",
    "node-helpers": "gitlab:team/helpers#9abc123"
  }
}
```

> 🚨 **SECURITY VULNERABILITY**: Short hashes are collision-vulnerable!

### ✅ **SECURE Dependencies**

```json
{
  "name": "my-app", 
  "dependencies": {
    "vue-lib": "github:user/vue-lib#a1b2c3d4e5f6789012345678901234567890abcd",
    "react-utils": "git+https://github.com/user/react-utils.git#ef4567a8901234567890123456789012345678ef",
    "node-helpers": "gitlab:team/helpers#9abc123456789012345678901234567890123456"
  }
}
```

> 🎉 **ALL DEPENDENCIES SECURE**: Full 40-character hashes provide maximum security!

---

## 🎯 What Gets Checked

### 📄 Files Validated
- ✅ `package.json` - All git dependency declarations
- ✅ `npm-shrinkwrap.json` - Resolved dependency hashes (if present)

### 🔍 URL Patterns Detected
- `github:org/repo#hash`
- `gitlab:org/repo#hash`
- `bitbucket:org/repo#hash`
- `git+https://github.com/org/repo.git#hash`
- `git+https://gitlab.com/org/repo.git#hash`
- `git+ssh://git@github.com/org/repo.git#hash`

### 🛡️ Security Validation
- ❌ **Flags**: 7-39 character hashes (collision vulnerable)
- ✅ **Passes**: 40-character hashes (cryptographically secure)
- ℹ️ **Ignores**: Non-hex references (tags, branches)
- ℹ️ **Ignores**: Very short hex strings (<7 chars, likely tags)

---

## 🚀 Usage

Add this action to your GitHub workflow:

```yaml
name: Security Check
on: [push, pull_request]

jobs:
  git-hash-security:
    runs-on: ubuntu-latest
    steps:
      - name: Git Hash Security Check
        uses: Automattic/vip-actions/git-hash-security-check@v0.7.1
```

---

## 📊 Security Benefits

| Benefit | Description |
|---------|-------------|
| 🛡️ **Collision Resistance** | Full 40-character hashes prevent collision attacks |
| 🔒 **Supply Chain Integrity** | Ensures dependencies point to exact commits |
| 📦 **Reproducible Builds** | Guarantees consistent dependency resolution |
| 🎯 **Zero False Positives** | Smart detection distinguishes tags from hashes |
| 🌐 **Multi-Platform** | Works across GitHub, GitLab, Bitbucket |
| ⚡ **Fast Validation** | Efficient regex-based scanning |

---

## 🔧 How to Fix Vulnerabilities

When the action detects short hashes:

1. **Update package.json** to use full 40-character commit hashes
2. **Delete npm-shrinkwrap.json** (if present)
3. **Run `npm install`** to regenerate with full hashes
4. **Commit the changes** and re-run the security check

### Finding Full Commit Hashes

```bash
# Get the full hash for a short reference
git ls-remote https://github.com/user/repo.git short-ref

# Or visit the GitHub commit page
https://github.com/user/repo/commit/short-ref
```
