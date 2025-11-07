/**
 * Comprehensive Integration Test Suite
 * Tests file structure, enhanced interface integration, and basic functionality
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(title, 'bold');
    log('='.repeat(60), 'cyan');
}

function logTest(name, passed, error = null) {
    if (passed) {
        log(`✓ ${name}`, 'green');
        results.passed++;
    } else {
        log(`✗ ${name}`, 'red');
        if (error) {
            log(`  Error: ${error}`, 'red');
            results.errors.push({ test: name, error: error.toString() });
        }
        results.failed++;
    }
}

// Test results
const results = {
    passed: 0,
    failed: 0,
    errors: []
};

console.log('🧪 Starting Comprehensive Integration Test Suite...\n');

// Test 1: Validate Core File Structure
logSection('FILE STRUCTURE VALIDATION');

const coreFiles = [
    'index.html',
    'QUICK_START.md',
    'README.md',
    'DEVELOPMENT.md',
    'package.json',
    'vercel.json'
];

coreFiles.forEach(file => {
    try {
        const exists = fs.existsSync(path.join(__dirname, '..', file));
        logTest(`Core file exists: ${file}`, exists);
    } catch (error) {
        logTest(`Core file exists: ${file}`, false, error);
    }
});

// Test 2: Validate Directory Structure
logSection('DIRECTORY STRUCTURE VALIDATION');

const directories = [
    'css',
    'js',
    'supabase',
    'tests'
];

directories.forEach(dir => {
    try {
        const exists = fs.existsSync(path.join(__dirname, '..', dir));
        logTest(`Directory exists: ${dir}/`, exists);
    } catch (error) {
        logTest(`Directory exists: ${dir}/`, false, error);
    }
});

// Test 3: Enhanced Interface Integration
logSection('ENHANCED INTERFACE INTEGRATION');

function checkFile(filePath, description) {
    const fullPath = path.join(__dirname, '..', filePath);
    try {
        const exists = fs.existsSync(fullPath);
        logTest(description, exists);
        return exists;
    } catch (error) {
        logTest(description, false, error);
        return false;
    }
}

function checkContent(filePath, searchString, description) {
    const fullPath = path.join(__dirname, '..', filePath);
    try {
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const found = content.includes(searchString);
            logTest(description, found);
            return found;
        } else {
            logTest(description, false, `File not found: ${filePath}`);
            return false;
        }
    } catch (error) {
        logTest(description, false, error);
        return false;
    }
}

// Check enhanced CSS integration
checkFile('css/enhanced-complete.css', 'Enhanced CSS master file exists');
checkContent('index.html', 'enhanced-complete.css', 'Enhanced CSS linked in index.html');

// Check JavaScript module loading
checkContent('index.html', 'state-management-integration.js', 'State management module loaded');
checkContent('index.html', 'navigation-integration.js', 'Navigation system loaded');
checkContent('index.html', 'interaction-integration.js', 'Interaction system loaded');
checkContent('index.html', 'keyboard-shortcuts-overlay.js', 'Keyboard shortcuts overlay loaded');

// Check HTML enhancements
checkContent('index.html', 'enhanced-container', 'Enhanced container class applied');
checkContent('index.html', 'enhanced-button', 'Enhanced button classes applied');

// Test 4: JavaScript Syntax Validation
logSection('JAVASCRIPT SYNTAX VALIDATION');

function validateJSSyntax(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    try {
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Basic syntax check - try to parse with Node.js
            try {
                // Remove import/export statements for basic syntax check
                let cleanContent = content
                    .replace(/import\s+.*?\s+from\s+['"`].*?['"`];?/g, '')
                    .replace(/export\s+(const|let|var|function|class|default)\s+.*?(?=\n|;|$)/g, '')
                    .replace(/export\s*{\s*[^}]*\s*};?/g, '');

                // Try to create a new Function to check syntax
                new Function(cleanContent);
                logTest(`JS Syntax: ${filePath}`, true);
                return true;
            } catch (syntaxError) {
                logTest(`JS Syntax: ${filePath}`, false, syntaxError.message);
                return false;
            }
        } else {
            logTest(`JS Syntax: ${filePath}`, false, 'File not found');
            return false;
        }
    } catch (error) {
        logTest(`JS Syntax: ${filePath}`, false, error);
        return false;
    }
}

// Validate key JavaScript files
const jsFiles = [
    'js/main.js',
    'js/config.js',
    'js/services/supabase.js',
    'js/state-management/state-store.js',
    'js/navigation/navigation-integration.js'
];

jsFiles.forEach(file => {
    validateJSSyntax(file);
});

// Test 5: CSS File Validation
logSection('CSS FILE VALIDATION');

function validateCSS(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    try {
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Basic CSS validation - check for balanced braces
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;

            const balanced = openBraces === closeBraces;
            logTest(`CSS Structure: ${filePath}`, balanced, balanced ? null : `Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
            return balanced;
        } else {
            logTest(`CSS Structure: ${filePath}`, false, 'File not found');
            return false;
        }
    } catch (error) {
        logTest(`CSS Structure: ${filePath}`, false, error);
        return false;
    }
}

// Validate key CSS files
const cssFiles = [
    'css/enhanced-complete.css',
    'css/variables-enhanced.css',
    'css/base.css'
];

cssFiles.forEach(file => {
    validateCSS(file);
});

// Test 6: Configuration Validation
logSection('CONFIGURATION VALIDATION');

// Check package.json
checkContent('package.json', '"name"', 'package.json has name field');
checkContent('package.json', '"version"', 'package.json has version field');

// Check vercel.json
checkFile('vercel.json', 'Vercel configuration exists');

// Test 7: Documentation Validation
logSection('DOCUMENTATION VALIDATION');

const docs = [
    'README.md',
    'QUICK_START.md',
    'DEVELOPMENT.md'
];

docs.forEach(doc => {
    checkFile(doc, `Documentation exists: ${doc}`);
});

// Final Results
logSection('TEST RESULTS SUMMARY');

const totalTests = results.passed + results.failed;
const successRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0;

log(`\n📊 Test Results:`, 'bold');
log(`✅ Passed: ${results.passed}`, 'green');
log(`❌ Failed: ${results.failed}`, 'red');
log(`📈 Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');

if (results.errors.length > 0) {
    log(`\n🚨 Errors:`, 'red');
    results.errors.forEach(error => {
        log(`  • ${error.test}: ${error.error}`, 'red');
    });
}

if (results.failed === 0) {
    log(`\n🎉 SUCCESS! All integration checks passed!`, 'green');
    process.exit(0);
} else {
    log(`\n⚠️  Some tests failed. Please review the errors above.`, 'yellow');
    process.exit(1);
}
