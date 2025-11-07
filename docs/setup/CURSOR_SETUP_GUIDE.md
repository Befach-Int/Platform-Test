# Cursor MCP Setup Guide

Complete guide to replicate your Claude CLI MCP environment in Cursor IDE.

## Overview

This guide will help you configure **7 MCP servers** in Cursor, giving you the same powerful capabilities you have in Claude CLI:

1. **Supabase MCP** - Database operations
2. **Vercel MCP** - Deployment management
3. **Playwright MCP** - Browser automation
4. **Puppeteer MCP** - Alternative browser automation
5. **Autonomous Frontend Browser Tools** - Live debugging
6. **21st.dev Magic MCP** - AI UI component generation
7. **Custom MCP-UI Server** - Project-specific components

---

## Prerequisites

- [ ] Cursor IDE installed (latest version)
- [ ] Node.js and npm installed
- [ ] Supabase account and project
- [ ] Vercel account
- [ ] 21st.dev account (for Magic MCP)
- [ ] Chrome browser (for Autonomous Browser Tools)

---

## Step 1: Configure MCP Servers in Cursor

### Open Cursor Settings

1. Open Cursor
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Preferences: Open User Settings (JSON)"
4. Add the MCP configuration below

### MCP Configuration JSON

Add this to your Cursor `settings.json`:

```json
{
  "mcp.servers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "env": {
        "SUPABASE_PROJECT_REF": "your_project_ref_here",
        "SUPABASE_ACCESS_TOKEN": "your_access_token_here"
      }
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com/"
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "puppeteer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "autonomous-browser-tools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@winds-ai/autonomous-frontend-browser-tools"],
      "env": {
        "API_BASE_URL": "http://localhost:3000/api",
        "CHROME_EXTENSION_ID": "your_extension_id_here"
      }
    },
    "21st-magic": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "TWENTYFIRST_API_KEY": "your_21st_api_key_here"
      }
    },
    "mcp-ui-components": {
      "type": "stdio",
      "command": "node",
      "args": ["c:\\Users\\harsh\\Downloads\\Platform Test\\mcp-ui-server.js"]
    }
  }
}
```

---

## Step 2: Configure API Keys and Tokens

### Supabase MCP

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy your **Project Reference ID** (e.g., `abcdefghij`)
5. Generate an **Access Token**:
   - Go to **Account Settings** → **Access Tokens**
   - Click "Generate new token"
   - Name it "Cursor MCP"
   - Copy the token

Update in `settings.json`:
```json
"SUPABASE_PROJECT_REF": "your_actual_project_ref",
"SUPABASE_ACCESS_TOKEN": "sbp_your_actual_token"
```

### Vercel MCP

Vercel MCP uses OAuth - you'll authenticate when first using it in Cursor.

### 21st.dev Magic MCP

1. Go to [21st.dev](https://21st.dev)
2. Sign in or create account
3. Navigate to **Settings** → **API Keys**
4. Generate a new API key
5. Copy the key

Update in `settings.json`:
```json
"TWENTYFIRST_API_KEY": "21st_your_actual_api_key"
```

### Autonomous Browser Tools

1. Install Chrome Extension:
   ```bash
   cd %LOCALAPPDATA%\npm\node_modules\@winds-ai\autonomous-frontend-browser-tools
   ```
2. Open Chrome → Extensions → Developer Mode → Load Unpacked
3. Select the extension folder
4. Copy the Extension ID from Chrome
5. Update in `settings.json`:
   ```json
   "CHROME_EXTENSION_ID": "your_actual_extension_id"
   ```

---

## Step 3: Install Required Dependencies

Open terminal in your project and run:

```bash
# Install custom MCP-UI server dependencies
npm install

# Verify npx-based MCPs can run (they auto-install on first use)
npx @playwright/mcp@latest --version
npx @modelcontextprotocol/server-puppeteer --version
npx @winds-ai/autonomous-frontend-browser-tools --version
npx @21st-dev/magic@latest --version
```

---

## Step 4: Configure Project-Specific Settings

### Create .cursorrules File

A `.cursorrules` file has been created in your project root with:
- Project context and architecture
- Database schema information
- Coding standards and patterns
- MCP usage guidelines

This file helps Cursor understand your project automatically.

### Verify .gitignore

Ensure sensitive files are not committed:
- `.env` files
- API keys in settings
- `.cursor/` directory (optional)

Already configured in [.gitignore](.gitignore):
```gitignore
.cursor/
.env
.env.local
```

---

## Step 5: Test MCP Connections

### Test Each MCP Server

Open Cursor's AI chat and try these commands:

1. **Supabase MCP**:
   ```
   List all tables in my Supabase project
   ```

2. **Vercel MCP**:
   ```
   Show my Vercel deployments
   ```

3. **Playwright MCP**:
   ```
   Take a screenshot of https://platform-test-cyan.vercel.app
   ```

4. **Puppeteer MCP**:
   ```
   Navigate to the homepage and capture console logs
   ```

5. **Autonomous Browser Tools**:
   ```
   Inspect the current browser tab's network requests
   ```
   (Requires Chrome with extension installed and DevTools open)

6. **21st.dev Magic MCP**:
   ```
   Create a modern card component for a feature item
   ```

7. **MCP-UI Components**:
   ```
   Generate a modal dialog with a form
   ```

### Expected Results

Each MCP should respond with appropriate data or actions:
- Supabase: Returns table list
- Vercel: Shows deployment history
- Playwright: Saves screenshot
- Puppeteer: Returns page data
- Browser Tools: Shows network activity
- 21st Magic: Returns React/Vue component code
- MCP-UI: Returns HTML/CSS component

---

## Step 6: Configure Cursor AI Features

### Enable Relevant Features

In Cursor Settings, enable:
- [ ] **Cursor Tab** (AI autocomplete)
- [ ] **Copilot++** (multi-line suggestions)
- [ ] **Chat** (AI conversation)
- [ ] **Cmd+K** (inline AI edits)

### Set AI Model Preferences

Cursor allows you to choose models:
- **GPT-4** for complex tasks
- **Claude 3.5 Sonnet** for code generation (recommended for this project)
- **GPT-3.5** for fast autocomplete

---

## Troubleshooting

### MCP Server Not Connecting

**Symptoms**: MCP commands fail or timeout

**Solutions**:
1. Check `settings.json` syntax (must be valid JSON)
2. Verify API keys are correct and not expired
3. Restart Cursor IDE
4. Check Cursor Output panel: View → Output → "MCP Servers"

### Supabase MCP Issues

**Common Issues**:
- Invalid project reference
- Expired access token
- Network/firewall blocking requests

**Fix**:
1. Verify project ref: `https://supabase.com/dashboard/project/YOUR_REF`
2. Regenerate access token if needed
3. Test connection: `curl https://mcp.supabase.com/mcp`

### 21st.dev Magic Not Working

**Symptoms**: Component generation fails

**Solutions**:
1. Verify API key is active: [21st.dev/settings](https://21st.dev/settings)
2. Check account has available credits
3. Try with `npx @21st-dev/magic@latest` in terminal first

### Autonomous Browser Tools Not Finding Extension

**Symptoms**: "Extension not connected" error

**Solutions**:
1. Ensure Chrome is running
2. Open DevTools on the target tab
3. Click extension icon to activate
4. Verify extension ID in settings matches Chrome

### Custom MCP-UI Server Fails

**Symptoms**: "Cannot find module" or server crash

**Solutions**:
1. Verify path in settings.json is absolute and correct
2. Run `npm install` in project directory
3. Test manually: `node mcp-ui-server.js`
4. Check file exists: `c:\Users\harsh\Downloads\Platform Test\mcp-ui-server.js`

---

## MCP Usage Examples

### Database Migration Workflow

```plaintext
You: Create a new migration to add a priority field to features

Cursor (using Supabase MCP):
1. Creates migration file: 20250111_add_priority_to_features.sql
2. Applies migration to database
3. Updates TypeScript types
4. Confirms success
```

### Deployment Workflow

```plaintext
You: Deploy to production and check status

Cursor (using Vercel MCP):
1. Runs build verification
2. Deploys to Vercel
3. Monitors deployment logs
4. Reports deployment URL
```

### UI Component Generation

```plaintext
You: I need a workspace selector dropdown with icons

Cursor (using 21st.dev Magic):
1. Searches component library
2. Finds matching dropdown pattern
3. Customizes for workspace data
4. Returns complete React/HTML code
```

### Browser Testing

```plaintext
You: Test the workspace creation flow

Cursor (using Playwright):
1. Navigates to application
2. Clicks "New Workspace" button
3. Fills form fields
4. Submits and verifies success
5. Takes screenshots
6. Reports results
```

---

## Advanced Configuration

### Custom MCP Server Development

Your project includes a custom MCP server ([mcp-ui-server.js](mcp-ui-server.js)). To create more:

1. Create new server file: `my-custom-mcp.js`
2. Implement MCP protocol (see `mcp-ui-server.js` as template)
3. Add to Cursor settings:
   ```json
   "my-custom-mcp": {
     "type": "stdio",
     "command": "node",
     "args": ["path/to/my-custom-mcp.js"]
   }
   ```

### Environment-Specific Configuration

For different environments (dev/staging/prod):

```json
{
  "mcp.servers": {
    "supabase-dev": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "env": {
        "SUPABASE_PROJECT_REF": "dev_project_ref"
      }
    },
    "supabase-prod": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "env": {
        "SUPABASE_PROJECT_REF": "prod_project_ref"
      }
    }
  }
}
```

Switch between them in Cursor chat by specifying which to use.

---

## Security Best Practices

### API Key Management

- **Never commit** API keys to git
- Store in Cursor's secure settings (encrypted)
- Use environment variables for sensitive data
- Rotate keys regularly

### .env File (Alternative Storage)

Create `.env` file (already in `.gitignore`):
```bash
SUPABASE_ACCESS_TOKEN=sbp_your_token
TWENTYFIRST_API_KEY=21st_your_key
CHROME_EXTENSION_ID=your_extension_id
```

Then reference in settings.json:
```json
"env": {
  "SUPABASE_ACCESS_TOKEN": "${env:SUPABASE_ACCESS_TOKEN}"
}
```

### Access Control

- Use **read-only** tokens when possible
- Limit Supabase token permissions to required scopes
- Monitor API usage in dashboards

---

## Comparison: Cursor vs Claude CLI

### Advantages of Cursor

- ✅ Integrated IDE experience
- ✅ Visual code navigation
- ✅ Inline AI edits (Cmd+K)
- ✅ Git integration in UI
- ✅ Multi-file context awareness
- ✅ Real-time autocomplete

### Advantages of Claude CLI

- ✅ Terminal-first workflow
- ✅ Faster for CLI tasks
- ✅ Easier MCP configuration (single file)
- ✅ Better for scripts and automation

### Best of Both Worlds

Use both tools:
- **Cursor**: Daily development, code editing, refactoring
- **Claude CLI**: Database migrations, deployments, automation scripts

They share the same MCP servers, so configurations are similar!

---

## Next Steps

After setup:

1. ✅ Test all 7 MCP connections
2. 📝 Read [.cursorrules](.cursorrules) to understand project context
3. 🎨 Try generating components with 21st.dev Magic
4. 🗄️ Run a test query with Supabase MCP
5. 🚀 Deploy to Vercel using Vercel MCP
6. 🧪 Create automated tests with Playwright

---

## Support Resources

- **Cursor Docs**: https://cursor.sh/docs
- **MCP Specification**: https://modelcontextprotocol.io
- **Supabase MCP**: https://github.com/supabase/mcp
- **Vercel MCP**: https://vercel.com/docs/mcp
- **21st.dev Docs**: https://docs.21st.dev
- **Project Documentation**: [CLAUDE.md](CLAUDE.md)

---

## Feedback and Issues

If you encounter issues:
1. Check Cursor Output panel: View → Output → "MCP Servers"
2. Review this guide's Troubleshooting section
3. Check MCP server logs
4. Verify API keys and tokens are valid

---

**Setup Date**: 2025-01-11
**Version**: 1.0
**Project**: Platform Roadmap Manager
