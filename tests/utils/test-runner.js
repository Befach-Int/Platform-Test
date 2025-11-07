/**
 * Test Runner Utility for Enhanced Interface Testing
 * Orchestrates browser automation tests using MCP tools
 */

class TestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
        this.startTime = Date.now();
    }

    /**
     * Run a single test case
     */
    async runTest(testName, testFn) {
        this.results.total++;
        console.log(`\n🧪 Running: ${testName}`);

        try {
            await testFn();
            this.results.passed++;
            this.results.tests.push({
                name: testName,
                status: 'PASSED',
                duration: 0
            });
            console.log(`✅ PASSED: ${testName}`);
            return true;
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({
                name: testName,
                status: 'FAILED',
                error: error.message,
                duration: 0
            });
            console.log(`❌ FAILED: ${testName}`);
            console.error(`   Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Run a test suite
     */
    async runSuite(suiteName, tests) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📦 Test Suite: ${suiteName}`);
        console.log('='.repeat(60));

        for (const [testName, testFn] of Object.entries(tests)) {
            await this.runTest(`${suiteName} - ${testName}`, testFn);
        }
    }

    /**
     * Generate test report
     */
    generateReport() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️  Skipped: ${this.results.skipped}`);
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📈 Pass Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        // Detailed results
        if (this.results.failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.tests
                .filter(t => t.status === 'FAILED')
                .forEach(t => {
                    console.log(`   - ${t.name}`);
                    console.log(`     Error: ${t.error}`);
                });
        }

        return this.results;
    }

    /**
     * Export results to JSON
     */
    exportResults(filename = 'test-results.json') {
        const results = {
            ...this.results,
            duration: (Date.now() - this.startTime) / 1000,
            timestamp: new Date().toISOString()
        };

        return JSON.stringify(results, null, 2);
    }
}

// Export for use in test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestRunner;
}
