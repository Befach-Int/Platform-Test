# 🛠️ Development Guide - Platform Roadmap Manager

## Overview

**Platform Roadmap Manager** - A multi-workspace roadmap planning application with AI-powered features, real-time Supabase sync, and Vercel deployment.

**Tech Stack:**
- Frontend: Vanilla HTML/CSS/JavaScript (ES6+)
- Database: Supabase (PostgreSQL)
- Storage: Dual (Supabase primary, localStorage cache)
- Deployment: Vercel
- MCP Servers: 7 active (Supabase, Vercel, Playwright, Puppeteer, Browser Tools, 21st Magic, MCP-UI)

**Live URL**: https://platform-test-cyan.vercel.app

---

## Architecture Principles

### Multi-Workspace System
- **Workspace isolation**: All data must filter by `workspace_id`
- **User scope**: Currently single-user (`user_id = 'default'`)
- **ID format**: Timestamp-based strings (`Date.now().toString()`) - NEVER use UUID
- **Workspace properties**: id, name, description, color (hex), icon (emoji), customInstructions, aiMemory
- **No cross-workspace references**: Features, timeline items, and links stay within workspace boundaries

### Database Schema (Supabase)
**Primary Tables:**
- `workspaces` - Workspace metadata and AI settings
- `features` - Top-level roadmap items with `workspace_id` foreign key
- `timeline_items` - Nested items with `feature_id` and timeline (MVP/SHORT/LONG)
- `linked_items` - Bidirectional relationships between timeline items
- `user_settings` - Global user preferences

**Key Constraints:**
- All tables have `user_id` and `workspace_id` columns
- RLS policies enabled (user + workspace filtering)
- Timestamps: `created_at`, `updated_at` (auto-managed)
- Soft deletes preferred over hard deletes

### Data Sync Strategy
1. **Write**: Save to localStorage immediately → Async sync to Supabase
2. **Read**: Load from Supabase → Cache in localStorage
3. **Real-time**: Subscribe to Supabase changes for cross-browser sync
4. **Conflict resolution**: Last write wins (timestamp-based)

---

## Coding Standards

### JavaScript Style
```javascript
// ✅ GOOD: Modern ES6+, descriptive names
const createWorkspace = async (name, description) => {
    const workspace = {
        id: Date.now().toString(),  // Timestamp ID
        name,
        description,
        color: '#3B82F6',
        icon: '📊',
        createdAt: new Date().toISOString()
    };
    return workspace;
};

// ❌ BAD: var, unclear names, UUID
var ws = function(n, d) {
    var w = { id: generateUUID(), nm: n, dsc: d };
    return w;
};
```

### Database Queries
```javascript
// ✅ GOOD: Workspace-scoped, error handling
const loadFeatures = async (workspaceId) => {
    try {
        const { data, error } = await supabase
            .from('features')
            .select('*')
            .eq('user_id', 'default')
            .eq('workspace_id', workspaceId)  // REQUIRED
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Failed to load features:', err);
        return [];
    }
};

// ❌ BAD: No workspace filter, no error handling
const loadFeatures = async () => {
    const { data } = await supabase.from('features').select('*');
    return data;
};
```

### HTML Components
```html
<!-- ✅ GOOD: Semantic, accessible, data attributes -->
<div class="workspace-card" data-workspace-id="1234567890">
    <div class="workspace-icon" aria-label="Workspace icon">📊</div>
    <h3 class="workspace-name">Product Roadmap</h3>
    <p class="workspace-description">Q1 2025 planning</p>
    <button class="btn-edit" aria-label="Edit workspace">Edit</button>
</div>

<!-- ❌ BAD: Generic, inline styles, no accessibility -->
<div id="ws123" style="padding:10px">
    <span>📊</span>
    <div>Product Roadmap</div>
    <a onclick="edit()">Edit</a>
</div>
```

---

## MCP Server Usage

### When to Use Each MCP

**Supabase MCP** - Use for:
- Database migrations (`CREATE TABLE`, `ALTER TABLE`)
- Complex queries (joins, aggregations)
- Schema inspection
- Database debugging
- Running SQL scripts

**Vercel MCP** - Use for:
- Production deployments
- Checking deployment status
- Environment variable management
- Deployment logs
- Build troubleshooting

**Playwright MCP** - Use for:
- E2E testing workflows
- Screenshot capture for documentation
- Form testing
- Navigation testing
- Multi-page flows

**Puppeteer MCP** - Use for:
- PDF generation
- Alternative browser automation
- Performance profiling
- Web scraping (if needed)

**Autonomous Browser Tools** - Use for:
- Live debugging (with Chrome DevTools open)
- Network request inspection
- Console log monitoring
- Real-time DOM inspection
- Supabase API call debugging

**21st.dev Magic MCP** - Use for:
- Generating modern UI components (React/Vue/Svelte)
- Finding component patterns
- Creating responsive layouts
- Accessibility-first components

**MCP-UI Components** - Use for:
- Project-specific HTML/CSS components
- Modals, cards, buttons
- Forms and tables
- Custom components matching existing styles

### MCP Usage Examples

```plaintext
// Database Migration
"Create a migration to add a 'priority' column to features table with values: low, medium, high"
→ Supabase MCP creates migration, applies it, updates schema

// Deployment
"Deploy the latest changes to production and show the deployment URL"
→ Vercel MCP builds, deploys, returns URL

// UI Component
"Generate a workspace selector dropdown with colored icons using our brand colors"
→ 21st Magic MCP returns modern, accessible component

// Testing
"Test the workspace creation flow with Playwright"
→ Playwright MCP runs E2E test, captures screenshots

// Debugging
"Check the network requests being made when I create a feature"
→ Autonomous Browser Tools shows Supabase POST requests with payloads
```

---

## File Structure

```
Platform Test/
├── index.html              # Main application UI
├── QUICK_START.md          # User guide and shortcuts
├── README.md               # Complete documentation
├── DEVELOPMENT.md          # Technical details (this file)
├── css/                    # Stylesheets (28 files)
├── js/                     # JavaScript modules (64 files)
├── supabase/               # Database migrations
├── tests/                  # Test infrastructure
├── docs/                   # Additional documentation
├── tools/                  # Development utilities
├── mcp/                    # MCP server configurations
├── package.json            # Dependencies
└── vercel.json            # Deployment config
```

---

## Implementation Details

### Enhanced Interface Features

#### Visual Enhancements
- **Contemporary Minimal Design** - Clean aesthetics with sophisticated color palette
- **60fps Animations** - Hardware-accelerated smooth transitions
- **Micro-Interactions** - Delightful hover effects and feedback on all interactive elements
- **Advanced Shadows** - Depth perception with colored shadows and gradients

#### Power User Features
- **Comprehensive Keyboard Navigation** - Press `?` to see all shortcuts
- **Keyboard Shortcuts Overlay** - Interactive reference guide
- **Gesture Support** - Touch-optimized interactions for mobile

#### Accessibility Excellence
- **WCAG 2.1 AA Compliant** - Meets international accessibility standards
- **Screen Reader Support** - Semantic HTML structure
- **High Contrast Mode** - For visual impairments
- **Reduced Motion** - Respects user preferences
- **Touch-Friendly** - 44px minimum target sizes

#### Architecture Enhancements
- **Redux-like State Management** - Centralized state with time-travel debugging
- **Real-Time Sync** - WebSocket-based synchronization (optional)
- **Progressive Disclosure** - Smart UI that reduces cognitive load
- **Responsive Design** - Seamless scaling across all devices

### State Management Integration
- **Centralized State Store** - Single source of truth for application state
- **Action-Based Updates** - Predictable state changes through actions
- **Middleware Support** - Extensible architecture for additional functionality
- **Persistence Layer** - Automatic state synchronization with localStorage/Supabase

### Navigation System
- **Contextual Navigation** - Smart navigation based on current context
- **Enhanced Navigation** - Advanced routing and view transitions
- **Gesture Navigation** - Touch and swipe gesture support
- **Keyboard Navigation** - Full keyboard accessibility

---

## Testing Infrastructure

### Test Categories
- **Browser Automation** - Interactive element tests (keyboard shortcuts, button interactions)
- **Accessibility** - WCAG 2.1 AA compliance tests
- **Performance** - FPS, load time, memory tests
- **Responsive** - Breakpoint and mobile tests

### Test Files
- `test-enhanced-integration.cjs` - Main integration test suite
- `tests/` directory - Organized test structure
- `test-runner.js` - Test execution utilities

### Running Tests
```bash
# Run all integration tests
node test-enhanced-integration.cjs

# Run specific test categories
node tests/run-keyboard-shortcuts-test.js

# Validate test infrastructure
node tests/validate-test-infrastructure.cjs
```

---

## Deployment Workflow

### Standard Process
```bash
# 1. Test locally
npm install
# Open index.html in browser

# 2. Apply migrations (if any)
npx supabase db push

# 3. Commit changes
git add .
git commit -m "feat: add priority field to features"
git push origin main

# 4. Deploy to Vercel
vercel --prod

# 5. Verify production
# Visit https://platform-test-cyan.vercel.app
```

### Using Vercel MCP
```plaintext
You: "Deploy to production and check if the build succeeded"
Cursor: [Uses Vercel MCP to deploy, monitors logs, reports status]
```

---

## Performance Optimization

### Database Queries
- **Index frequently filtered columns**: `workspace_id`, `user_id`, `created_at`
- **Batch operations**: Use Supabase batch insert/update when possible
- **Limit data**: Don't load all workspaces if only using one

### Frontend
- **Lazy load**: Load features only when workspace is selected
- **Debounce saves**: Don't save on every keystroke (300ms debounce)
- **Cache smartly**: Use localStorage to reduce API calls

### Supabase Real-time
- **Subscribe selectively**: Only subscribe to current workspace's changes
- **Unsubscribe on switch**: Clean up subscriptions when switching workspaces

---

## Security Considerations

### API Keys
- **Never commit**: API keys in `.env` files (already in `.gitignore`)
- **Use anon key**: Client-side uses Supabase anon key only
- **Service role key**: Only for backend/migration scripts (not in browser)

### Data Validation
```javascript
// ✅ Validate user input
const createWorkspace = (name, description) => {
    if (!name || name.trim().length === 0) {
        throw new Error('Workspace name is required');
    }
    if (name.length > 100) {
        throw new Error('Workspace name too long (max 100 chars)');
    }
    // ... create workspace
};
```

### SQL Injection Prevention
- **Use parameterized queries**: Supabase client handles this automatically
- **Never concatenate user input into SQL strings**

---

## Common Patterns

### Adding New Fields to Features

**1. Update Data Model**:
```javascript
// In feature creation logic
const feature = {
    // ... existing fields
    newField: value  // Add new field
};
```

**2. Create Migration**:
```sql
-- supabase/migrations/20250111_add_new_field.sql
ALTER TABLE features ADD COLUMN IF NOT EXISTS new_field TEXT;
CREATE INDEX IF NOT EXISTS idx_features_new_field ON features(new_field);
UPDATE features SET new_field = 'default' WHERE new_field IS NULL;
```

**3. Update Sync Method**:
```javascript
// In supabaseService.js
const featuresData = features.map(f => ({
    // ... existing mappings
    new_field: f.newField  // camelCase → snake_case
}));
```

**4. Update Export/Import**:
```javascript
// Ensure new field is included in backup JSON
```

### Creating Workspace-Scoped Features

**Always include workspace context**:
```javascript
// ✅ Correct
const createFeature = (title, description) => {
    if (!this.currentWorkspaceId) {
        throw new Error('No active workspace');
    }

    const feature = {
        id: Date.now().toString(),
        workspaceId: this.currentWorkspaceId,  // REQUIRED
        title,
        description,
        timelineItems: [],
        createdAt: new Date().toISOString()
    };

    return feature;
};

// ❌ Wrong - no workspace assignment
const createFeature = (title, description) => {
    return { id: Date.now().toString(), title, description };
};
```

### Bidirectional Link Creation

**Always maintain both directions**:
```javascript
const createLink = (sourceItemId, targetItemId, relationshipType) => {
    const links = [
        {
            id: Date.now().toString(),
            sourceItemId,
            targetItemId,
            relationshipType,  // 'dependency' or 'complements'
            direction: 'outgoing'
        },
        {
            id: (Date.now() + 1).toString(),
            sourceItemId: targetItemId,
            targetItemId: sourceItemId,
            relationshipType,
            direction: 'incoming'  // Reverse direction
        }
    ];

    return links;
};
```

---

## Error Handling

### Supabase Errors
```javascript
try {
    const { data, error } = await supabase
        .from('features')
        .insert(featureData);

    if (error) {
        // Log full error for debugging
        console.error('Supabase error:', error);

        // Show user-friendly message
        showNotification('Failed to save feature. Please try again.', 'error');
        return null;
    }

    return data;
} catch (err) {
    console.error('Unexpected error:', err);
    showNotification('An unexpected error occurred.', 'error');
    return null;
}
```

### Network Failures
```javascript
const syncWithRetry = async (data, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await supabaseService.syncData(data);
            return true;
        } catch (err) {
            console.warn(`Sync attempt ${i + 1} failed:`, err);
            if (i === maxRetries - 1) {
                showNotification('Sync failed. Data saved locally.', 'warning');
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};
```

---

## Troubleshooting Common Issues

### Features Not Showing After Workspace Switch
**Cause**: Features not filtered by `workspace_id`
**Fix**: Ensure all queries include `.eq('workspace_id', currentWorkspaceId)`

### Import Fails with "Invalid Data"
**Cause**: Backup JSON missing `version` field or wrong structure
**Fix**: Check backup has `{ version: '2.0', workspaces: [...], features: [...] }`

### Supabase Sync Fails Silently
**Cause**: RLS policies blocking inserts, or network issues
**Fix**: Check browser console, verify Supabase project is active

### Duplicate Links Created
**Cause**: Bidirectional links not checked before creation
**Fix**: Check if link exists before creating (both directions)

### Workspace Selector Empty
**Cause**: No workspaces in database, or failed to load
**Fix**: Run `migrate_existing_data.sql` or create first workspace

---

## Version History

- **v2.0** (2025-01-11): Multi-workspace support, Supabase sync, MCP integration
- **v1.0** (2024): Initial single-workspace localStorage-only version

---

## Quick Reference

### File Structure
```
Platform Test/
├── index.html              # Main application UI
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
├── supabase/               # Database migrations
├── tests/                  # Test infrastructure
├── docs/                   # Additional documentation
├── tools/                  # Development utilities
└── mcp/                   # MCP server configurations
```

### Important Constants
```javascript
USER_ID = 'default'                    // Single-user mode
TIMELINE_TYPES = ['MVP', 'SHORT', 'LONG']
RELATIONSHIP_TYPES = ['dependency', 'complements']
DIRECTIONS = ['incoming', 'outgoing']
```

### Color Palette (CSS Variables)
```css
--primary-blue: #3B82F6
--primary-dark: #1E40AF
--success-green: #10B981
--warning-yellow: #F59E0B
--danger-red: #EF4444
--neutral-gray: #6B7280
```

---

**Last Updated**: January 11, 2025
**Main Documentation**: [README.md](README.md)
**Quick Start**: [QUICK_START.md](QUICK_START.md)
