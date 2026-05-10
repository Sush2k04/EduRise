# GitHub Actions Setup Guide for EduRise

## Overview
This document describes the GitHub Actions CI/CD pipelines configured for the EduRise project.

## Workflow Files

### 1. **backend-ci.yml** - Backend Continuous Integration
- **Trigger**: Push/PR to `main` or `develop` branches when backend files change
- **Tests on**: Node 16.x, 18.x, 20.x
- **Checks**:
  - Installs dependencies using `npm ci`
  - Runs linting (if configured)
  - Security vulnerability audit
  - Basic server startup verification
  - Runs tests (if configured)

### 2. **frontend-ci.yml** - Frontend Continuous Integration
- **Trigger**: Push/PR to `main` or `develop` branches when frontend files change
- **Tests on**: Node 16.x, 18.x, 20.x
- **Checks**:
  - Installs dependencies
  - Runs ESLint
  - Builds project
  - Uploads build artifacts

### 3. **overall-ci.yml** - Overall Pipeline
- **Trigger**: Every push/PR to main or develop
- **Checks**:
  - Repository structure validation
  - File size checks
  - Backend and frontend verification in parallel

### 4. **dependency-check.yml** - Dependency Security
- **Trigger**: 
  - When package.json changes
  - Weekly schedule (every Sunday)
- **Checks**:
  - Dependency audit
  - Outdated package detection

## Required Setup Steps

### 1. Enable GitHub Actions
1. Go to your GitHub repository
2. Navigate to **Settings** → **Actions**
3. Ensure "Actions permissions" is enabled

### 2. Configure Branch Protection (Optional but Recommended)
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Require status checks to pass before merging:
   - `backend-ci`
   - `frontend-ci`
   - `overall-ci`

### 3. Environment Variables & Secrets
Add the following secrets in **Settings** → **Secrets and variables** → **Actions**:

```
MONGODB_URI          # MongoDB connection string
JWT_SECRET           # JWT signing secret
VITE_API_URL         # Frontend API URL
```

### 4. Update package.json Scripts (Optional)

To enhance CI/CD, add test scripts:

**Backend** (`edurise-backend/package.json`):
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "lint": "eslint .",
    "test": "jest"
  }
}
```

**Frontend** (`edurise-frontend/package.json`):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

## Testing the Workflows

### Local Testing (using act)
Install `act` to test workflows locally:
```bash
choco install act  # Windows
brew install act   # macOS
```

Run a workflow:
```bash
act push -j backend-check
act push -j frontend-check
```

### Manual Trigger
In GitHub: **Actions** → Select workflow → **Run workflow** → **Run workflow** button

## Best Practices

1. **Commit Regularly**: Workflows run on every push
2. **Use Branch Protection**: Prevent merging of failing builds
3. **Monitor Secrets**: Never commit `.env` files
4. **Review Logs**: Check workflow logs for failures
5. **Update Dependencies**: Monitor security alerts
6. **Cache Dependencies**: Workflows cache npm modules for speed

## Troubleshooting

### Workflow Not Running
- Check branch name matches trigger condition
- Verify file paths in `paths` section
- Ensure `.github/workflows/` directory is committed

### Build Failures
- Check Node.js version compatibility
- Verify environment variables are set
- Review error logs in GitHub Actions

### Security Issues
- Update vulnerable dependencies
- Enable Dependabot alerts in repository settings
- Review npm audit reports

## Next Steps

1. Configure secrets in GitHub repository settings
2. Set up branch protection rules for `main`
3. Add test scripts to package.json files
4. Monitor first workflow runs
5. Adjust workflows based on your needs
