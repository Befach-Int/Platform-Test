/**
 * Phase 5.2 - Chat Panel Testing Suite
 * Automated tests for js/ui/chat-panel.js
 *
 * Tests: 25+ automated tests for chat panel functionality
 *
 * Run via: test_runner.html or standalone in browser console
 */

const testPhase5ChatPanel = {
    results: [],
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,

    log(message, type = 'info') {
        const emoji = type === 'pass' ? '✅' : type === 'fail' ? '❌' : 'ℹ️';
        console.log(`${emoji} ${message}`);
    },

    assert(condition, testName, errorMessage = '') {
        this.totalTests++;
        if (condition) {
            this.passedTests++;
            this.log(`${testName}`, 'pass');
            this.results.push({ test: testName, passed: true });
        } else {
            this.failedTests++;
            this.log(`${testName} - ${errorMessage}`, 'fail');
            this.results.push({ test: testName, passed: false, error: errorMessage });
        }
    },

    // ============================================================================
    // MESSAGE FORMATTING TESTS
    // ============================================================================

    testFormatMessage_Bold() {
        const input = "This is **bold text** in a sentence.";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<strong>bold text</strong>'),
            'formatMessage - Bold text',
            `Expected <strong>bold text</strong>, got: ${output}`
        );
    },

    testFormatMessage_Italic() {
        const input = "This is *italic text* in a sentence.";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<em>italic text</em>'),
            'formatMessage - Italic text',
            `Expected <em>italic text</em>, got: ${output}`
        );
    },

    testFormatMessage_InlineCode() {
        const input = "Use the `console.log()` function.";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<code>console.log()</code>'),
            'formatMessage - Inline code',
            `Expected <code>console.log()</code>, got: ${output}`
        );
    },

    testFormatMessage_CodeBlock() {
        const input = "```javascript\nconst x = 5;\n```";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<pre><code>') && output.includes('const x = 5;'),
            'formatMessage - Code block',
            `Expected code block with const x = 5;, got: ${output}`
        );
    },

    testFormatMessage_Header1() {
        const input = "# Main Title";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<h1>Main Title</h1>'),
            'formatMessage - H1 header',
            `Expected <h1>Main Title</h1>, got: ${output}`
        );
    },

    testFormatMessage_Header2() {
        const input = "## Subtitle";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<h2>Subtitle</h2>'),
            'formatMessage - H2 header',
            `Expected <h2>Subtitle</h2>, got: ${output}`
        );
    },

    testFormatMessage_Header3() {
        const input = "### Section";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<h3>Section</h3>'),
            'formatMessage - H3 header',
            `Expected <h3>Section</h3>, got: ${output}`
        );
    },

    testFormatMessage_BulletList() {
        const input = "- Item 1\n- Item 2\n- Item 3";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<ul>') && output.includes('<li>Item 1</li>'),
            'formatMessage - Bullet list',
            `Expected <ul> with list items, got: ${output}`
        );
    },

    testFormatMessage_NumberedList() {
        const input = "1. First\n2. Second\n3. Third";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<ol>') && output.includes('<li>First</li>'),
            'formatMessage - Numbered list',
            `Expected <ol> with list items, got: ${output}`
        );
    },

    testFormatMessage_LineBreaks() {
        const input = "Line 1\n\nLine 2";
        const output = chatPanel.formatMessage(input);
        this.assert(
            output.includes('<br>') || output.includes('</p>'),
            'formatMessage - Line breaks',
            `Expected line breaks, got: ${output}`
        );
    },

    // ============================================================================
    // TABLE FORMATTING TESTS
    // ============================================================================

    testFormatTables_SimpleTable() {
        const input = "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |";
        const output = chatPanel.formatTables(input);
        this.assert(
            output.includes('<table class="ai-table">') && output.includes('<thead>') && output.includes('<tbody>'),
            'formatTables - Simple table structure',
            `Expected table with thead and tbody, got: ${output}`
        );
    },

    testFormatTables_TableHeaders() {
        const input = "| Name | Age |\n|------|-----|\n| John | 30  |";
        const output = chatPanel.formatTables(input);
        this.assert(
            output.includes('<th>Name</th>') && output.includes('<th>Age</th>'),
            'formatTables - Table headers',
            `Expected <th> elements, got: ${output}`
        );
    },

    testFormatTables_TableData() {
        const input = "| Name | Age |\n|------|-----|\n| John | 30  |";
        const output = chatPanel.formatTables(input);
        this.assert(
            output.includes('<td>John</td>') && output.includes('<td>30</td>'),
            'formatTables - Table data',
            `Expected <td> elements, got: ${output}`
        );
    },

    testFormatTables_TableWrapper() {
        const input = "| Col1 | Col2 |\n|------|------|\n| A    | B    |";
        const output = chatPanel.formatTables(input);
        this.assert(
            output.includes('<table class="ai-table">'),
            'formatTables - Table class applied',
            `Expected ai-table class, got: ${output}`
        );
    },

    testFormatTables_NoTablePassthrough() {
        const input = "Just regular text without any tables.";
        const output = chatPanel.formatTables(input);
        this.assert(
            output === input,
            'formatTables - Non-table text passthrough',
            `Expected unchanged text, got: ${output}`
        );
    },

    // ============================================================================
    // HTML SANITIZATION TESTS (XSS Protection)
    // ============================================================================

    testSanitizeHtml_ScriptTag() {
        const input = '<script>alert("XSS")</script><p>Safe content</p>';
        const output = chatPanel.sanitizeHtml(input);
        this.assert(
            !output.includes('<script>') && output.includes('Safe content'),
            'sanitizeHtml - Script tag removal',
            `Script tag should be removed, got: ${output}`
        );
    },

    testSanitizeHtml_OnclickAttribute() {
        const input = '<div onclick="alert(\'XSS\')">Click me</div>';
        const output = chatPanel.sanitizeHtml(input);
        this.assert(
            !output.includes('onclick'),
            'sanitizeHtml - onclick attribute removal',
            `onclick should be removed, got: ${output}`
        );
    },

    testSanitizeHtml_JavascriptURL() {
        const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
        const output = chatPanel.sanitizeHtml(input);
        this.assert(
            !output.includes('javascript:'),
            'sanitizeHtml - javascript: URL removal',
            `javascript: URL should be removed, got: ${output}`
        );
    },

    testSanitizeHtml_OnerrorAttribute() {
        const input = '<img src="x" onerror="alert(\'XSS\')">';
        const output = chatPanel.sanitizeHtml(input);
        this.assert(
            !output.includes('onerror'),
            'sanitizeHtml - onerror attribute removal',
            `onerror should be removed, got: ${output}`
        );
    },

    testSanitizeHtml_SafeTagsPreserved() {
        const input = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
        const output = chatPanel.sanitizeHtml(input);
        this.assert(
            output.includes('<strong>') && output.includes('<em>'),
            'sanitizeHtml - Safe tags preserved',
            `Safe tags should be preserved, got: ${output}`
        );
    },

    testSanitizeHtml_CodeBlocksPreserved() {
        const input = '<pre><code>const x = 5;</code></pre>';
        const output = chatPanel.sanitizeHtml(input);
        this.assert(
            output.includes('<pre>') && output.includes('<code>'),
            'sanitizeHtml - Code blocks preserved',
            `Code blocks should be preserved, got: ${output}`
        );
    },

    // ============================================================================
    // AI TOOLS CONFIGURATION TESTS
    // ============================================================================

    testGetAITools_ReturnsArray() {
        const tools = chatPanel.getAITools();
        this.assert(
            Array.isArray(tools),
            'getAITools - Returns array',
            `Expected array, got: ${typeof tools}`
        );
    },

    testGetAITools_HasSearchTool() {
        const tools = chatPanel.getAITools();
        const searchTool = tools.find(t => t.function && t.function.name === 'search_internet');
        this.assert(
            searchTool !== undefined,
            'getAITools - Has search_internet tool',
            'search_internet tool not found'
        );
    },

    testGetAITools_HasUpdateFeatureTool() {
        const tools = chatPanel.getAITools();
        const updateTool = tools.find(t => t.function && t.function.name === 'update_feature');
        this.assert(
            updateTool !== undefined,
            'getAITools - Has update_feature tool',
            'update_feature tool not found'
        );
    },

    testGetAITools_HasCreateFeatureTool() {
        const tools = chatPanel.getAITools();
        const createTool = tools.find(t => t.function && t.function.name === 'create_feature');
        this.assert(
            createTool !== undefined,
            'getAITools - Has create_feature tool',
            'create_feature tool not found'
        );
    },

    testGetAITools_ToolStructure() {
        const tools = chatPanel.getAITools();
        const firstTool = tools[0];
        this.assert(
            firstTool.type === 'function' &&
            firstTool.function &&
            firstTool.function.name &&
            firstTool.function.description,
            'getAITools - Tool structure valid',
            'Tool structure should have type, function.name, function.description'
        );
    },

    // ============================================================================
    // CONTEXT FORMATTING TESTS
    // ============================================================================

    testFormatFeaturesForContext_WithNoFeatures() {
        const mockApp = {
            features: []
        };
        const context = chatPanel.formatFeaturesForContext(mockApp);
        this.assert(
            typeof context === 'string',
            'formatFeaturesForContext - Returns string with no features',
            `Expected string, got: ${typeof context}`
        );
    },

    testFormatFeaturesForContext_WithFeatures() {
        const mockApp = {
            features: [
                {
                    name: 'Test Feature',
                    type: 'Feature',
                    purpose: 'Testing purposes',
                    timelineItems: [
                        {
                            timeline: 'MVP',
                            difficulty: 'Medium',
                            text: 'Implement core logic'
                        }
                    ]
                }
            ]
        };
        const context = chatPanel.formatFeaturesForContext(mockApp);
        this.assert(
            context.includes('Test Feature') &&
            context.includes('Testing purposes') &&
            context.includes('MVP'),
            'formatFeaturesForContext - Includes feature details',
            `Expected feature details in context, got: ${context.substring(0, 200)}`
        );
    },

    testFormatFeaturesForContext_HandlesMultipleFeatures() {
        const mockApp = {
            features: [
                { name: 'Feature 1', type: 'Feature', purpose: 'Purpose 1', timelineItems: [] },
                { name: 'Feature 2', type: 'Epic', purpose: 'Purpose 2', timelineItems: [] }
            ]
        };
        const context = chatPanel.formatFeaturesForContext(mockApp);
        this.assert(
            context.includes('Feature 1') && context.includes('Feature 2'),
            'formatFeaturesForContext - Handles multiple features',
            'Expected both features in context'
        );
    },

    // ============================================================================
    // INTEGRATION TESTS
    // ============================================================================

    testChatPanel_ObjectExists() {
        this.assert(
            typeof chatPanel === 'object' && chatPanel !== null,
            'chatPanel object exists',
            'chatPanel object should be defined in global scope'
        );
    },

    testChatPanel_HasAllMethods() {
        const requiredMethods = [
            'toggleChat',
            'sendMessage',
            'addChatMessage',
            'updateCounters',
            'updateMemoryContextIndicator',
            'formatMessage',
            'formatTables',
            'sanitizeHtml',
            'getAITools',
            'formatFeaturesForContext',
            'toggleMessageExpand',
            'toggleSources',
            'setupChatPanelResize',
            'compactConversation',
            'executeSearchInternet',
            'executeSearchInternetSilent',
            'displayBatchedSearchResults'
        ];

        const missingMethods = requiredMethods.filter(method => typeof chatPanel[method] !== 'function');

        this.assert(
            missingMethods.length === 0,
            'chatPanel has all required methods',
            `Missing methods: ${missingMethods.join(', ')}`
        );
    },

    // ============================================================================
    // RUN ALL TESTS
    // ============================================================================

    runAll() {
        console.log('\n🧪 Starting Phase 5.2 Chat Panel Tests...\n');
        this.results = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;

        // Message Formatting Tests
        console.log('\n📝 Message Formatting Tests:');
        this.testFormatMessage_Bold();
        this.testFormatMessage_Italic();
        this.testFormatMessage_InlineCode();
        this.testFormatMessage_CodeBlock();
        this.testFormatMessage_Header1();
        this.testFormatMessage_Header2();
        this.testFormatMessage_Header3();
        this.testFormatMessage_BulletList();
        this.testFormatMessage_NumberedList();
        this.testFormatMessage_LineBreaks();

        // Table Formatting Tests
        console.log('\n📊 Table Formatting Tests:');
        this.testFormatTables_SimpleTable();
        this.testFormatTables_TableHeaders();
        this.testFormatTables_TableData();
        this.testFormatTables_TableWrapper();
        this.testFormatTables_NoTablePassthrough();

        // HTML Sanitization Tests
        console.log('\n🔒 HTML Sanitization (XSS Protection) Tests:');
        this.testSanitizeHtml_ScriptTag();
        this.testSanitizeHtml_OnclickAttribute();
        this.testSanitizeHtml_JavascriptURL();
        this.testSanitizeHtml_OnerrorAttribute();
        this.testSanitizeHtml_SafeTagsPreserved();
        this.testSanitizeHtml_CodeBlocksPreserved();

        // AI Tools Tests
        console.log('\n🤖 AI Tools Configuration Tests:');
        this.testGetAITools_ReturnsArray();
        this.testGetAITools_HasSearchTool();
        this.testGetAITools_HasUpdateFeatureTool();
        this.testGetAITools_HasCreateFeatureTool();
        this.testGetAITools_ToolStructure();

        // Context Formatting Tests
        console.log('\n📋 Context Formatting Tests:');
        this.testFormatFeaturesForContext_WithNoFeatures();
        this.testFormatFeaturesForContext_WithFeatures();
        this.testFormatFeaturesForContext_HandlesMultipleFeatures();

        // Integration Tests
        console.log('\n🔗 Integration Tests:');
        this.testChatPanel_ObjectExists();
        this.testChatPanel_HasAllMethods();

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        if (this.failedTests === 0) {
            console.log('\n🎉 All tests passed! Chat panel is ready for manual testing.');
        } else {
            console.log('\n⚠️  Some tests failed. Review failures above.');
            console.log('\nFailed tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  ❌ ${r.test}: ${r.error}`);
            });
        }

        return {
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.failedTests,
            results: this.results
        };
    }
};

// Auto-run if loaded in test runner
if (typeof window !== 'undefined') {
    console.log('Phase 5.2 Chat Panel test suite loaded. Run testPhase5ChatPanel.runAll() to execute tests.');
}
