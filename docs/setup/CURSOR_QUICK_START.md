# Cursor Quick Start Checklist

Follow this checklist to replicate your MCP setup in Cursor IDE.

## ⚡ Quick Setup (15 minutes)

### Step 1: Install Cursor
- [ ] Download from [cursor.sh](https://cursor.sh)
- [ ] Install and launch Cursor
- [ ] Sign in or create account
- [ ] Restart Cursor to ensure it's fully initialized

### Step 2: Configure MCP Servers
- [ ] Open Cursor
- [ ] Press `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
- [ ] Look for the `"mcp.servers"` section (create if missing)
- [ ] Copy **ALL** content from [cursor-mcp-config.json](cursor-mcp-config.json)
- [ ] Paste into your settings.json under `"mcp.servers": { ... }`
- [ ] Verify JSON is valid (no syntax errors)
- [ ] Save the file

### Step 3: Add API Keys

#### Supabase Keys (REQUIRED)
- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Select your project
- [ ] Navigate to **Settings** → **API** 
- [ ] Copy **Project Reference ID** (looks like: `abcdefghij`)
- [ ] Go to **Account Settings** → **Access Tokens**
- [ ] Click "Generate new token", name it "Cursor MCP"
- [ ] Copy the token (starts with `sbp_`)
- [ ] In settings.json, replace:
  - `YOUR_PROJECT_REF_HERE` → your Project Reference ID
  - `YOUR_ACCESS_TOKEN_HERE` → your Access Token
- [ ] Save the file

#### 21st.dev API Key (RECOMMENDED)
- [ ] Go to [21st.dev](https://21st.dev)
- [ ] Sign in to your account
- [ ] Go to **Settings** → **API Keys**
- [ ] Generate a new API key
- [ ] Copy the key
- [ ] In settings.json, replace `YOUR_21ST_API_KEY_HERE` with your key
- [ ] Save the file

#### Chrome Extension (OPTIONAL - for live debugging)
- [ ] Open Chrome and go to `chrome://extensions`
- [ ] Enable **Developer Mode** (toggle top right)
- [ ] Click **Load unpacked**
- [ ] Navigate to Chrome's extension folder for autonomous-browser-tools
- [ ] Select the extension folder
- [ ] Copy the **Extension ID** from the extension card
- [ ] In settings.json, replace `YOUR_CHROME_EXTENSION_ID_HERE` with the ID
- [ ] Save the file

### Step 4: Install Dependencies
- [ ] Open terminal in project directory
- [ ] Run: `npm install`
- [ ] Wait for completion (should say "up to date" since dependencies already installed)

### Step 5: Test MCP Connections (One By One)
Open Cursor's AI chat and try each command below. Wait for a response before moving to the next.

- [ ] **Supabase**: Ask "List all tables in my database"
  - Expected: Returns list of tables (workspaces, features, timeline_items, etc.)
  
- [ ] **Vercel**: Ask "Show my Vercel deployments"
  - Expected: Shows deployment history (may prompt for OAuth)
  
- [ ] **21st Magic**: Ask "Create a simple card component"
  - Expected: Returns React/Vue component code
  
- [ ] **MCP-UI**: Ask "Generate a modal dialog"
  - Expected: Returns HTML/CSS component code
  
- [ ] **Playwright**: Ask "Take a screenshot of https://platform-test-cyan.vercel.app"
  - Expected: Saves screenshot file

- [ ] **Puppeteer**: Ask "Navigate to https://platform-test-cyan.vercel.app and describe the page"
  - Expected: Returns page content description

- [ ] **Browser Tools** (optional - requires Chrome setup): 
  - Open your app in Chrome with DevTools
  - Ask: "What console errors are visible?"
  - Expected: Returns console messages from the browser

### Step 6: Verify Setup Is Complete
- [ ] All 7 MCPs responded successfully
- [ ] No syntax errors in settings.json
- [ ] All required API keys are in place
- [ ] npm dependencies installed

---

## 🎯 What You Get

### 7 Powerful MCP Servers

1. **Supabase** → Database operations, migrations, queries
2. **Vercel** → Deploy to production, check status
3. **Playwright** → Automated testing, screenshots
4. **Puppeteer** → Browser automation
5. **Autonomous Browser Tools** → Live debugging
6. **21st.dev Magic** → AI component generation
7. **MCP-UI** → Custom HTML/CSS components

### Enhanced Cursor Features

- 🤖 **AI Code Generation** - Context-aware suggestions
- 🗄️ **Database Management** - SQL queries via natural language
- 🚀 **One-Click Deployment** - Deploy to Vercel from chat
- 🎨 **UI Component Library** - Generate modern components instantly
- 🧪 **Automated Testing** - E2E tests with Playwright
- 🔍 **Live Debugging** - Inspect running app in real-time

---

## 📚 Documentation

- **Full Setup Guide**: [CURSOR_SETUP_GUIDE.md](CURSOR_SETUP_GUIDE.md)
- **Project Rules**: [.cursorrules](.cursorrules)
- **Development Guidelines**: [CLAUDE.md](CLAUDE.md)

---

## 🆘 Need Help?

### MCP Not Connecting?
1. Check `settings.json` syntax (valid JSON?)
2. Verify API keys are correct
3. Restart Cursor
4. View → Output → "MCP Servers" for logs

### Can't Find Settings JSON?
- Windows: `%APPDATA%\Cursor\User\settings.json`
- Mac: `~/Library/Application Support/Cursor/User/settings.json`
- Linux: `~/.config/Cursor/User/settings.json`

### API Key Issues?
- Supabase: Regenerate in dashboard
- 21st.dev: Check account has credits
- Vercel: Will authenticate via OAuth on first use

---

## 🚀 Example Workflows

### Create a Feature
```
You: "Create a new migration to add a status field to features"
Cursor + Supabase MCP:
  → Creates migration file
  → Applies to database
  → Updates TypeScript types
  → Confirms success
```

### Deploy to Production
```
You: "Deploy latest changes and give me the URL"
Cursor + Vercel MCP:
  → Builds project
  → Deploys to Vercel
  → Returns deployment URL
```

### Generate UI Component
```
You: "Create a workspace selector dropdown with icons"
Cursor + 21st Magic:
  → Searches component library
  → Customizes for your data
  → Returns production-ready code
```

### Test Workflow
```
You: "Test the workspace creation flow with Playwright"
Cursor + Playwright MCP:
  → Automates browser test
  → Fills form, submits
  → Takes screenshots
  → Reports results
```

---

## ✅ You're Ready!

Once you've completed the checklist above, you'll have the same powerful MCP environment in Cursor that you have in Claude CLI.

**Estimated Setup Time**: 15-20 minutes
**Your Current Claude CLI Config**: Fully replicated
**MCP Servers**: All 7 configured and ready

Happy coding! 🎉
