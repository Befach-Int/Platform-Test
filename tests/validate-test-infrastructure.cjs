/**
 * Test Infrastructure Validation
 * Verifies that all test files and directories are properly set up
 */

const fs = require('fs');
const path = require('path');

class TestInfrastructureValidator {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            checks: []
        };
    }

    check(description, testFn) {
        this.results.total++;
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${description}`);
                this.results.passed++;
                this.results.checks.push({ description, status: 'PASSED' });
            } else {
                console.log(`❌ ${description}`);
                this.results.failed++;
                this.results.checks.push({ description, status: 'FAILED' });
            }
        } catch (error) {
            console.log(`❌ ${description}`);
            console.log(`   Error: ${error.message}`);
            this.results.failed++;
            this.results.checks.push({
                description,
                status: 'FAILED',
                error: error.message
            });
        }
    }

    run() {
        console.log('🧪 Test Infrastructure Validation\n');
        console.log('='.repeat(60));

        // Check directories exist
        console.log('\n📁 Checking Test Directories...');
        this.check('tests/ directory exists', () =>
            fs.existsSync(path.join(__dirname, '../')));

        this.check('tests/browser-automation/ exists', () =>
            fs.existsSync(path.join(__dirname, 'browser-automation')));

        this.check('tests/accessibility/ exists', () =>
            fs.existsSync(path.join(__dirname, 'accessibility')));

        this.check('tests/performance/ exists', () =>
            fs.existsSync(path.join(__dirname, 'performance')));

        this.check('tests/responsive/ exists', () =>
            fs.existsSync(path.join(__dirname, 'responsive')));

        this.check('tests/utils/ exists', () =>
            fs.existsSync(path.join(__dirname, 'utils')));

        this.check('tests/screenshots/ exists', () =>
            fs.existsSync(path.join(__dirname, 'screenshots')));

        // Check test files exist
        console.log('\n📝 Checking Test Files...');
        this.check('keyboard-shortcuts.test.js exists', () =>
            fs.existsSync(path.join(__dirname, 'browser-automation/keyboard-shortcuts.test.js')));

        this.check('button-interactions.test.js exists', () =>
            fs.existsSync(path.join(__dirname, 'browser-automation/button-interactions.test.js')));

        this.check('test-runner.js utility exists', () =>
            fs.existsSync(path.join(__dirname, 'utils/test-runner.js')));

        this.check('run-keyboard-shortcuts-test.js exists', () =>
            fs.existsSync(path.join(__dirname, 'run-keyboard-shortcuts-test.js')));

        this.check('README.md exists', () =>
            fs.existsSync(path.join(__dirname, 'README.md')));

        // Check test file content
        console.log('\n🔍 Validating Test Content...');
        this.check('Keyboard shortcuts test has 10 tests defined', () => {
            const content = fs.readFileSync(
                path.join(__dirname, 'browser-automation/keyboard-shortcuts.test.js'),
                'utf8'
            );
            const matches = content.match(/async \(\) => \{/g);
            return matches && matches.length >= 10;
        });

        this.check('Button interactions test has 15 tests defined', () => {
            const content = fs.readFileSync(
                path.join(__dirname, 'browser-automation/button-interactions.test.js'),
                'utf8'
            );
            const matches = content.match(/async \(\) => \{/g);
            return matches && matches.length >= 15;
        });

        // Check for MCP tool references
        console.log('\n🔧 Checking MCP Tool References...');
        this.check('Tests reference mcp__playwright tools', () => {
            const content = fs.readFileSync(
                path.join(__dirname, 'browser-automation/keyboard-shortcuts.test.js'),
                'utf8'
            );
            return content.includes('mcp__playwright__');
        });

        this.check('Tests reference browser_navigate', () => {
            const content = fs.readFileSync(
                path.join(__dirname, 'browser-automation/keyboard-shortcuts.test.js'),
                'utf8'
            );
            return content.includes('browser_navigate');
        });

        this.check('Tests reference browser_press_key', () => {
            const content = fs.readFileSync(
                path.join(__dirname, 'browser-automation/keyboard-shortcuts.test.js'),
                'utf8'
            );
            return content.includes('browser_press_key');
        });

        this.check('Tests reference browser_snapshot', () => {
            const content = fs.readFileSync(
                path.join(__dirname, 'browser-automation/keyboard-shortcuts.test.js'),
                'utf8'
            );
            return content.includes('browser_snapshot');
        });

        // Check application files exist
        console.log('\n🎯 Checking Application Files...');
        const appRoot = path.join(__dirname, '..');

        this.check('index.html exists', () =>
            fs.existsSync(path.join(appRoot, 'index.html')));

        this.check('showcase-enhanced-interface.html exists', () =>
            fs.existsSync(path.join(appRoot, 'showcase-enhanced-interface.html')));

        this.check('css/enhanced-complete.css exists', () =>
            fs.existsSync(path.join(appRoot, 'css/enhanced-complete.css')));

        this.check('js/ui/keyboard-shortcuts-overlay.js exists', () =>
            fs.existsSync(path.join(appRoot, 'js/ui/keyboard-shortcuts-overlay.js')));

        // Generate report
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Checks: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Pass Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        if (this.results.failed > 0) {
            console.log('\n❌ Failed Checks:');
            this.results.checks
                .filter(c => c.status === 'FAILED')
                .forEach(c => {
                    console.log(`   - ${c.description}`);
                    if (c.error) {
                        console.log(`     Error: ${c.error}`);
                    }
                });
        }

        if (this.results.passed === this.results.total) {
            console.log('\n🎉 SUCCESS! Test infrastructure is properly set up!\n');
            console.log('Next steps:');
            console.log('1. Configure MCP browser automation tools');
            console.log('2. Run: node tests/run-keyboard-shortcuts-test.js');
            console.log('3. Check tests/screenshots/ for visual results\n');
        } else {
            console.log('\n⚠️  Some checks failed. Please fix the issues above.\n');
        }

        // Save results
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const resultsFile = path.join(resultsDir, 'infrastructure-validation.json');
        fs.writeFileSync(resultsFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            ...this.results
        }, null, 2));

        console.log(`💾 Results saved to: ${path.relative(path.join(__dirname, '..'), resultsFile)}\n`);
    }
}

// Run validation
const validator = new TestInfrastructureValidator();
validator.run();
