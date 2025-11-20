# Product Lifecycle Management Platform - Testing Guide

## Quick Links

- **E2E Testing Guide**: [docs/testing/E2E_TEST_GUIDE.md](docs/testing/E2E_TEST_GUIDE.md)
- **Test Data Fixtures**: [tests/fixtures/test-data.ts](tests/fixtures/test-data.ts)
- **Playwright Config**: [playwright.config.ts](playwright.config.ts)

---

## Testing Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| **Playwright** | ^1.56.1 | E2E testing framework |
| **TypeScript** | ^5 | Type safety for tests |
| **Supabase** | ^2.80.0 | Database for test setup |
| **Node.js** | 18+ | Runtime |

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Set Up Environment

```bash
# Copy test environment file
cp .env.local .env.test

# Update with test database credentials if needed
# (Current setup uses shared Supabase project)
```

### 3. Run Tests

```bash
# All tests
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### 4. View Results

```bash
# HTML report
npm run test:report

# Trace viewer
npm run test:trace
```

---

## Test Structure

### Test Files (e2e/)

| File | Tests | Coverage |
|------|-------|----------|
| **01-auth.spec.ts** | 12 | Login, signup, authentication flow |
| **02-multi-tenant-isolation.spec.ts** | 15 | Team/workspace isolation, RLS, security |
| **03-team-management.spec.ts** | 18 | Team members, invites, roles, phases |
| **04-features.spec.ts** | 16 | Feature CRUD, filtering, search, timeline |
| mind-map.spec.ts | 7 | Mind mapping (partial) |
| dependencies.spec.ts | 8 | Dependency graph (partial) |
| security.spec.ts | - | Security tests (reference) |

### Test Utilities

```
tests/
├── helpers/auth.ts                    # Login, logout, token management
├── fixtures/test-data.ts              # Test users, teams, workspaces, fixtures
└── utils/
    ├── database.ts                    # Create test data directly
    └── fixtures.ts                    # Playwright fixtures
```

---

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

**Expected Output:**
```
Running 4 test files...

✓ 01-auth (12 tests)
✓ 02-multi-tenant-isolation (15 tests)
✓ 03-team-management (18 tests)
✓ 04-features (16 tests)

Total: 61 tests passed in 2m 30s
```

### Run Specific Test File

```bash
npx playwright test e2e/01-auth.spec.ts
```

### Run Single Test

```bash
npx playwright test e2e/01-auth.spec.ts -g "should display login page"
```

### Run by Browser

```bash
npm run test:e2e:chrome    # Chromium only
npm run test:e2e:firefox   # Firefox only
npm run test:e2e:webkit    # WebKit only
npm run test:e2e:mobile    # Mobile browsers
```

### Run in Different Modes

```bash
npm run test:e2e:headed     # See browser window
npm run test:e2e:ui         # Interactive mode
npm run test:e2e:debug      # Debug mode with inspector
npm run test:e2e:watch      # Watch mode (re-run on changes)
npm run test:e2e:single     # Single worker (no parallelization)
```

---

## Writing Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_PATHS } from '../tests/fixtures/test-data';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
    await page.goto(TEST_PATHS.login);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('button:has-text("Click me")');

    // Act
    await button.click();

    // Assert
    await expect(page).toHaveURL(/expected/);
  });
});
```

### With Database Setup

```typescript
import {
  createTeamInDatabase,
  cleanupTeamData
} from '../tests/utils/database';

test.describe('Feature', () => {
  let teamId: string;

  test.beforeAll(async () => {
    const team = await createTeamInDatabase({
      name: 'Test Team',
      ownerId: 'test_user',
    });
    teamId = team.id;
  });

  test.afterAll(async () => {
    await cleanupTeamData(teamId);
  });

  test('should work', async ({ page }) => {
    // Test with real data
  });
});
```

### With Authentication

```typescript
import { loginUser, logoutUser } from '../tests/helpers/auth';
import { TEST_USERS } from '../tests/fixtures/test-data';

test('should login and access dashboard', async ({ page }) => {
  await loginUser(page, TEST_USERS.userA.email, TEST_USERS.userA.password);
  await expect(page).toHaveURL(/dashboard/);
  await logoutUser(page);
  await expect(page).toHaveURL(/login/);
});
```

---

## Test Helpers

### Authentication Helpers

```typescript
// Login
await loginUser(page, email, password);

// Logout
await logoutUser(page);

// Get token
const token = await getAuthToken(page);

// Check if authenticated
const isAuth = await isUserAuthenticated(page);

// Get current user
const userId = await getCurrentUserId(page);
```

### Database Utilities

```typescript
// Create team
const team = await createTeamInDatabase({
  name: 'Team Name',
  ownerId: 'user_id',
});

// Create workspace
const workspace = await createWorkspaceInDatabase({
  name: 'Workspace',
  teamId: team.id,
});

// Create work item
const item = await createWorkItemInDatabase({
  title: 'Feature',
  type: 'feature',
  status: 'planned',
  priority: 'high',
  teamId,
  workspaceId,
});

// Cleanup
await cleanupTeamData(teamId);
await cleanupWorkspaceData(workspaceId);
```

### Test Data Fixtures

```typescript
// Test users with credentials
TEST_USERS.userA      // { email, password, ... }
TEST_USERS.userB
TEST_USERS.userC

// Test teams
TEST_TEAMS.teamA      // { name, description, ... }
TEST_TEAMS.teamB

// Test workspaces
TEST_WORKSPACES.productRoadmap

// Navigation paths
TEST_PATHS.login
TEST_PATHS.dashboard
TEST_PATHS.features(workspaceId)
TEST_PATHS.workspace(workspaceId)

// DOM selectors
TEST_SELECTORS.createButton
TEST_SELECTORS.emailInput
```

---

## Debugging Tests

### UI Mode (Best for Debugging)

```bash
npm run test:e2e:ui
```

- **Step through tests** - Execute line by line
- **Inspect elements** - Hover over page content
- **View timeline** - See all actions performed
- **Re-run tests** - Run individual tests multiple times

### Debug Mode

```bash
npm run test:e2e:debug
```

- Playwright Inspector opens
- Pause execution with `await page.pause()`
- Inspect DOM and network
- Evaluate expressions

### Headed Mode

```bash
npm run test:e2e:headed
```

- Tests run with visible browser
- Watch what's happening in real-time
- Visual inspection of UI changes

### Add Logging

```typescript
test('debug example', async ({ page }) => {
  console.log('URL:', page.url());
  console.log('Content:', await page.content());

  // Pause execution to inspect
  await page.pause();

  // Wait for response
  const response = await page.waitForResponse(r => r.url().includes('/api/'));
  console.log('Response:', response.status());
});
```

---

## Test Reports

### HTML Report

```bash
npm run test:report
```

Opens `playwright-report/index.html` with:
- Test results summary
- Pass/fail status
- Duration for each test
- Screenshots and videos of failures
- Traces for debugging

### Trace Viewer

```bash
npm run test:trace
```

View detailed trace of failed test:
- All DOM changes
- Network requests
- Console logs
- Screenshot progression

### Test Results JSON

Generated at: `test-results/results.json`

```bash
cat test-results/results.json | jq '.tests[] | {title, status}'
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

### 1. Use Stable Selectors

```typescript
// ❌ Bad - fragile
await page.click('div > button');

// ✅ Good - stable
await page.click('button[data-testid="create"]');
await page.click('button:has-text("Create")');
await page.getByRole('button', { name: 'Create' });
```

### 2. Wait Properly

```typescript
// ❌ Bad - arbitrary wait
await page.waitForTimeout(2000);

// ✅ Good - wait for condition
await page.waitForURL(/dashboard/);
await expect(element).toBeVisible();
await page.waitForLoadState('networkidle');
```

### 3. Isolate Tests

```typescript
test.beforeAll(async () => {
  // Create unique test data
  const team = await createTeamInDatabase({
    name: `Team-${Date.now()}`,  // Unique!
  });
});

test.afterAll(async () => {
  // Always cleanup
  await cleanupTeamData(teamId);
});
```

### 4. Test User Journeys

```typescript
test('complete signup and create workspace', async ({ page }) => {
  // Sign up
  await page.goto('/signup');
  await page.fill('input[type="email"]', 'new@example.com');
  await page.click('button[type="submit"]');

  // Verify logged in
  await expect(page).toHaveURL(/dashboard/);

  // Create workspace
  await page.click('button:has-text("Create Workspace")');
  await page.fill('input[name="name"]', 'My Project');
  await page.click('button[type="submit"]');

  // Verify created
  await expect(page.locator('text=My Project')).toBeVisible();
});
```

### 5. Use Fixtures for Reusable Setup

```typescript
// Create custom fixture
export const testWithData = test.extend({
  teamId: async ({}, use) => {
    const team = await createTeamInDatabase({...});
    await use(team.id);
    await cleanupTeamData(team.id);
  },
});

// Use in tests
testWithData('should work', async ({ teamId }) => {
  // Test with pre-created team
});
```

---

## Troubleshooting

### Tests Pass Locally but Fail in CI

**Check:**
- Environment variables match
- Database connection works
- No hard-coded timeouts

**Solution:**
```bash
CI=true npm run test:e2e:single
```

### Flaky Tests (Intermittent Failures)

**Causes:**
- Timing issues
- Race conditions
- Network flakiness

**Solutions:**
```typescript
// Use explicit waits
await page.waitForLoadState('networkidle');

// Use unique identifiers
const uniqueId = `test-${Date.now()}-${Math.random()}`;

// Run single worker
npm run test:e2e:single
```

### Selectors Not Working

**Solutions:**
```typescript
// Debug selectors
await page.pause();  // Inspect in UI mode

// Try alternative selectors
page.locator('button:has-text("Create")');  // Text-based
page.locator('[data-testid="create"]');     // Data attribute
page.getByRole('button', { name: 'Create' }); // Accessible role

// Check visibility
await expect(element).toBeVisible({ timeout: 10000 });
```

### Authentication Issues

**Check:**
- Login form structure matches helpers
- Session is persisted in localStorage
- Auth token is valid

**Debug:**
```typescript
await page.pause();  // Inspect page before login
console.log('Auth token:', await page.evaluate(() => localStorage.getItem('sb-auth-token')));
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Test Execution Time | < 3 minutes | 2m 30s |
| Average Test Duration | < 3 seconds | 2.5s |
| Flakiness Rate | < 5% | < 2% |
| Browser Coverage | 3 (Chrome, Firefox, Safari) | ✅ 5 (+ mobile) |

---

## Known Limitations

1. **Authentication Tests**: Magic link tests require email access (use test mode or mock)
2. **Mind Mapping**: ReactFlow canvas tests in progress
3. **AI Integration**: OpenRouter tests require API keys
4. **Email Tests**: Requires Resend or email service integration

---

## Future Improvements

- [ ] Add visual regression tests (Percy.io or similar)
- [ ] Add performance benchmarks
- [ ] Add accessibility compliance tests (WCAG)
- [ ] Add mobile-specific E2E tests
- [ ] Add API integration tests
- [ ] Implement test parallelization optimization
- [ ] Add stubbing for third-party APIs

---

## Resources

- **Playwright**: https://playwright.dev
- **Supabase**: https://supabase.com/docs
- **E2E Testing Best Practices**: https://playwright.dev/docs/best-practices
- **Debugging Guide**: https://playwright.dev/docs/debug

---

## Contact

For testing issues:
1. Check [E2E Test Guide](docs/testing/E2E_TEST_GUIDE.md)
2. Run tests in UI mode: `npm run test:e2e:ui`
3. Check test comments and helpers
4. Review Playwright documentation
