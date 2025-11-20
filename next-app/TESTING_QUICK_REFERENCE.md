# E2E Testing - Quick Reference Card

## 🚀 Quick Start

```bash
# Install and setup
npm install
npx playwright install

# Run all tests
npm run test:e2e

# Interactive debugging
npm run test:e2e:ui

# View results
npm run test:report
```

---

## 📋 Common Commands

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all tests |
| `npm run test:e2e:ui` | Interactive mode (best for debugging) |
| `npm run test:e2e:headed` | See browser window |
| `npm run test:e2e:debug` | Debug with Playwright Inspector |
| `npm run test:e2e:chrome` | Chromium only |
| `npm run test:e2e:firefox` | Firefox only |
| `npm run test:e2e:webkit` | WebKit only |
| `npm run test:e2e:mobile` | Mobile browsers |
| `npm run test:e2e:single` | Single worker (no parallelization) |
| `npm run test:e2e:watch` | Watch mode (re-run on changes) |
| `npm run test:report` | View HTML report |
| `npm run test:trace` | View trace from failed test |

---

## 🧪 Running Specific Tests

```bash
# Specific test file
npx playwright test e2e/01-auth.spec.ts

# Single test by name
npx playwright test e2e/01-auth.spec.ts -g "should display login"

# Multiple files
npx playwright test e2e/01-auth.spec.ts e2e/03-team-management.spec.ts

# All tests in describe block
npx playwright test e2e/01-auth.spec.ts -g "Authentication"
```

---

## 📝 Writing a Simple Test

```typescript
import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_PATHS } from '../tests/fixtures/test-data';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto(TEST_PATHS.login);

    // Act
    await page.fill('input[type="email"]', TEST_USERS.userA.email);
    await page.click('button[type="submit"]');

    // Assert
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

---

## 🔐 Using Authentication

```typescript
import { loginUser, logoutUser } from '../tests/helpers/auth';
import { TEST_USERS } from '../tests/fixtures/test-data';

test('authenticated flow', async ({ page }) => {
  // Login
  await loginUser(page, TEST_USERS.userA.email, TEST_USERS.userA.password);

  // Use the page
  await expect(page).toHaveURL(/dashboard/);

  // Logout
  await logoutUser(page);
  await expect(page).toHaveURL(/login/);
});
```

---

## 🗄️ Using Database Setup

```typescript
import {
  createTeamInDatabase,
  createWorkspaceInDatabase,
  cleanupTeamData,
} from '../tests/utils/database';

test.describe('Feature', () => {
  let teamId: string;
  let workspaceId: string;

  test.beforeAll(async () => {
    // Create test data
    const team = await createTeamInDatabase({
      name: 'Test Team',
      ownerId: 'test_user',
    });
    teamId = team.id;

    const workspace = await createWorkspaceInDatabase({
      name: 'Test Workspace',
      teamId,
    });
    workspaceId = workspace.id;
  });

  test.afterAll(async () => {
    // Cleanup
    await cleanupTeamData(teamId);
  });

  test('should work', async ({ page }) => {
    await page.goto(`/workspaces/${workspaceId}`);
    // ... test assertions
  });
});
```

---

## 🎯 Common Selectors

```typescript
// By text
page.locator('button:has-text("Click me")')
page.locator('text=Welcome')

// By role
page.getByRole('button', { name: 'Create' })
page.getByRole('textbox', { name: 'Email' })

// By test ID
page.locator('[data-testid="create-button"]')

// By attribute
page.locator('input[type="email"]')
page.locator('button[aria-label="menu"]')

// By placeholder
page.locator('input[placeholder*="search"]')

// Complex
page.locator('form').locator('button[type="submit"]')
```

---

## ⏱️ Waiting for Elements

```typescript
// Wait for URL change
await page.waitForURL(/dashboard/);

// Wait for element visible
await expect(element).toBeVisible({ timeout: 5000 });

// Wait for element hidden
await expect(element).not.toBeVisible();

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific response
const response = await page.waitForResponse(r => r.url().includes('/api/'));

// Pause for debugging
await page.pause();

// Explicit wait (avoid if possible)
await page.waitForTimeout(1000);  // Only as last resort
```

---

## 🐛 Debugging Tips

### UI Mode (Best Option)
```bash
npm run test:e2e:ui
```
- Step through tests
- Inspect elements
- View timeline
- Re-run individual tests

### Debug Mode
```bash
npm run test:e2e:debug
```
- Playwright Inspector opens
- Step through code
- Pause execution

### Add Logging
```typescript
test('my test', async ({ page }) => {
  console.log('Current URL:', page.url());
  await page.pause();  // Pause execution
  console.log('Content:', await page.textContent());
});
```

### Inspect Page
```typescript
await page.pause();  // Opens Inspector
// Inspect DOM, evaluate JS, etc.
```

---

## ✅ Test Checklist

Before committing tests:

- [ ] Test passes locally
- [ ] Test passes with `npm run test:e2e:ui`
- [ ] Test uses stable selectors (not nth-child)
- [ ] Test uses proper waits (not arbitrary timeouts)
- [ ] Test cleans up after itself
- [ ] Test doesn't depend on other tests
- [ ] Test uses test data fixtures
- [ ] Test is well-documented with comments
- [ ] Test follows naming convention
- [ ] Test is organized in proper describe block

---

## 🚨 Common Issues & Fixes

### **Selector Not Finding Element**
```typescript
// Debug with UI mode
npm run test:e2e:ui

// Try alternative selectors
page.locator('button:has-text("Create")');  // Text-based
page.getByRole('button', { name: 'Create' });  // Role-based
page.locator('[data-testid="create"]');     // Test ID
```

### **Flaky Tests (Intermittent Failures)**
```typescript
// Use proper waits
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();

// Use unique identifiers
const uniqueName = `item-${Date.now()}-${Math.random()}`;

// Run single worker
npm run test:e2e:single
```

### **Timeout Errors**
```typescript
// Increase timeout for specific wait
await page.waitForURL(/dashboard/, { timeout: 15000 });

// Check if page is responsive
console.log('Page URL:', page.url());
await page.waitForLoadState('networkidle');
```

### **Authentication Not Working**
```typescript
// Check login form structure
await page.pause();  // Inspect page

// Verify token is saved
const token = await page.evaluate(() => localStorage.getItem('sb-auth-token'));
console.log('Auth token:', token);
```

---

## 📊 Test Files Overview

| File | Tests | Purpose |
|------|-------|---------|
| `01-auth.spec.ts` | 15 | Login, signup, authentication |
| `02-multi-tenant-isolation.spec.ts` | 24 | Security, team isolation |
| `03-team-management.spec.ts` | 23 | Team members, invites, roles |
| `04-features.spec.ts` | 14 | Feature CRUD, filtering, search |

---

## 🔧 Helper Functions

### Authentication
```typescript
await loginUser(page, email, password)        // Login
await logoutUser(page)                        // Logout
const token = await getAuthToken(page)        // Get JWT
const isAuth = await isUserAuthenticated(page) // Check auth
```

### Database
```typescript
const team = await createTeamInDatabase({...})
const ws = await createWorkspaceInDatabase({...})
const item = await createWorkItemInDatabase({...})
await cleanupTeamData(teamId)
```

### Test Data
```typescript
TEST_USERS.userA                // { email, password }
TEST_TEAMS.teamA                // { name, description }
TEST_WORKSPACES.productRoadmap  // Workspace data
TEST_PATHS.login                // "/login"
TEST_SELECTORS.createButton     // Selector string
```

---

## 📈 Test Execution Tips

### Run Tests Faster
```bash
# Run in single browser
npm run test:e2e:chrome

# Run single worker (no parallelization)
npm run test:e2e:single

# Run specific test file only
npx playwright test e2e/01-auth.spec.ts
```

### Better Debugging
```bash
# Use UI mode
npm run test:e2e:ui

# Save artifacts on failure
# Already configured in playwright.config.ts
# Check: playwright-report/, test-results/
```

### Validate Before Commit
```bash
# Run all tests
npm run test:e2e

# View report
npm run test:report

# Check for failures
echo $?  # Exit code (0 = success)
```

---

## 📚 Documentation Links

- **Full Guide**: [docs/testing/E2E_TEST_GUIDE.md](docs/testing/E2E_TEST_GUIDE.md)
- **Quick Guide**: [README_TESTING.md](README_TESTING.md)
- **Summary**: [E2E_TESTING_SUMMARY.md](E2E_TESTING_SUMMARY.md)
- **Playwright Docs**: https://playwright.dev
- **Test Files**: `e2e/*.spec.ts`

---

## ⚡ Pro Tips

1. **Use UI Mode for Everything** - `npm run test:e2e:ui` is the most productive
2. **Keep Tests Small** - One assertion per test when possible
3. **Use Test Data Fixtures** - Avoid hardcoded values
4. **Wait for Conditions** - Never use arbitrary `waitForTimeout()`
5. **Pause to Debug** - `await page.pause()` in UI mode
6. **Check Test Isolation** - Use `test.beforeAll/afterAll` for cleanup
7. **Use Stable Selectors** - Prefer `data-testid` or `:has-text()`
8. **Read Error Messages** - Playwright gives detailed failure info
9. **Review Artifacts** - Check screenshots/videos on failure
10. **Keep Learning** - Read test files for patterns and examples

---

## 🎓 Next Steps

1. ✅ Run `npm run test:e2e:ui` to see tests in action
2. ✅ Review [E2E_TEST_GUIDE.md](docs/testing/E2E_TEST_GUIDE.md)
3. ✅ Write a simple test following the template
4. ✅ Use helpers and fixtures in your tests
5. ✅ Debug with UI mode when tests fail
6. ✅ Check artifacts (screenshots, videos) on failure

---

**Status**: ✅ Ready to use!

**Support**: See [E2E_TEST_GUIDE.md](docs/testing/E2E_TEST_GUIDE.md) for detailed help.
