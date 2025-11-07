/**
 * Comprehensive Test Suite for Phase 3 (Services) and Phase 4 (Data Managers)
 * Run in browser console after loading index.html
 */

console.log('🧪 Starting Comprehensive Phase 3 & Phase 4 Tests...\n');
console.log('=' .repeat(80));

let totalPassed = 0;
let totalFailed = 0;
const failedTests = [];

function test(name, fn) {
    try {
        const result = fn();
        if (result) {
            console.log(`✅ PASS: ${name}`);
            totalPassed++;
            return true;
        } else {
            console.log(`❌ FAIL: ${name}`);
            totalFailed++;
            failedTests.push(name);
            return false;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${name} - ${error.message}`);
        totalFailed++;
        failedTests.push(`${name} (${error.message})`);
        return false;
    }
}

console.log('\n📦 PHASE 3: SERVICE LAYER TESTS');
console.log('=' .repeat(80));

// ============================================================================
// STORAGE SERVICE TESTS
// ============================================================================
console.log('\n🗄️  Storage Service Tests');
console.log('-'.repeat(80));

test('Storage service exists', () => {
    return typeof storageService !== 'undefined';
});

test('Storage has all KEYS constants', () => {
    return storageService.KEYS &&
           storageService.KEYS.FEATURES &&
           storageService.KEYS.WORKSPACES &&
           storageService.KEYS.OPENROUTER_KEY;
});

test('Storage can save and load API key', () => {
    const testKey = 'test-api-key-' + Date.now();
    storageService.saveApiKey(testKey);
    const loaded = storageService.loadApiKey();
    return loaded === testKey;
});

test('Storage can save and load features', () => {
    const testFeatures = [
        { id: '1', name: 'Test Feature', workspaceId: 'ws1' }
    ];
    storageService.saveFeatures(testFeatures);
    const loaded = storageService.loadFeatures();
    return Array.isArray(loaded) && loaded.length === 1 && loaded[0].name === 'Test Feature';
});

test('Storage exportAllData includes version', () => {
    const exported = storageService.exportAllData();
    return exported.version === '2.0' && exported.exportDate;
});

// ============================================================================
// AI SERVICE TESTS
// ============================================================================
console.log('\n🤖 AI Service Tests');
console.log('-'.repeat(80));

test('AI service exists', () => {
    return typeof aiService !== 'undefined';
});

test('AI service has all core methods', () => {
    const methods = [
        'chat', 'analyzeConversationForMemory', 'summarizeTimelineItems',
        'analyzeBatchLinks', 'generateExecutionPlan', 'suggestResources',
        'generateMilestones', 'suggestPrerequisites', 'generateEnhancementQuestions',
        'synthesizeSearchResults', 'parseAIJSON', 'buildConversationContext',
        'validateApiKey'
    ];
    return methods.every(m => typeof aiService[m] === 'function');
});

test('AI parseAIJSON handles direct JSON', () => {
    const result = aiService.parseAIJSON('[{"test": "value"}]');
    return Array.isArray(result) && result[0].test === 'value';
});

test('AI parseAIJSON handles markdown wrapped JSON', () => {
    const markdown = '```json\n[{"test": "value"}]\n```';
    const result = aiService.parseAIJSON(markdown);
    return Array.isArray(result) && result[0].test === 'value';
});

test('AI buildConversationContext includes memory', () => {
    const memory = [{ content: 'User prefers React' }];
    const context = aiService.buildConversationContext(memory, '');
    return context.includes('User prefers React');
});

// ============================================================================
// SEARCH SERVICES TESTS
// ============================================================================
console.log('\n🔍 Search Services Tests');
console.log('-'.repeat(80));

test('Tavily service exists', () => {
    return typeof tavilyService !== 'undefined';
});

test('Tavily has core methods', () => {
    const methods = ['search', 'analyzeFeatureForSearch', 'generateSmartQueries', 'findInspiration'];
    return methods.every(m => typeof tavilyService[m] === 'function');
});

test('Exa service exists', () => {
    return typeof exaService !== 'undefined';
});

test('Exa has core methods', () => {
    const methods = ['search', 'analyzeFeatureForSearch', 'rankResults', 'findInspiration'];
    return methods.every(m => typeof exaService[m] === 'function');
});

test('Perplexity service exists', () => {
    return typeof perplexityService !== 'undefined';
});

test('Perplexity has core methods', () => {
    const methods = ['search', 'analyzeFeatureForQuery', 'formatCitations', 'getInsights'];
    return methods.every(m => typeof perplexityService[m] === 'function');
});

// ============================================================================
// SEARCH ORCHESTRATOR TESTS
// ============================================================================
console.log('\n🎯 Search Orchestrator Tests');
console.log('-'.repeat(80));

test('Search orchestrator exists', () => {
    return typeof searchOrchestrator !== 'undefined';
});

test('Search orchestrator has all methods', () => {
    const methods = [
        'routeSearch', 'safeCall', 'checkAvailableApis', 'analyzeIntent',
        'explainIntent', 'mergeResults', 'rankResults', 'getAvailabilityStatus'
    ];
    return methods.every(m => typeof searchOrchestrator[m] === 'function');
});

test('checkAvailableApis returns object', () => {
    const apis = searchOrchestrator.checkAvailableApis();
    return typeof apis === 'object' &&
           'tavily' in apis &&
           'exa' in apis &&
           'perplexity' in apis;
});

test('analyzeIntent works with test feature', () => {
    const feature = {
        name: 'Test Feature',
        categories: ['Research'],
        difficulty: 'hard'
    };
    const intent = searchOrchestrator.analyzeIntent(feature);
    return intent &&
           intent.primary === 'comprehensive-research' &&
           typeof intent.confidence === 'number' &&
           typeof intent.reasoning === 'string';
});

test('mergeResults deduplicates by URL', () => {
    const results = [
        [{ url: 'https://example.com/1', title: 'Test 1' }],
        [{ url: 'https://example.com/1', title: 'Test 1 Dup' }],
        [{ url: 'https://example.com/2', title: 'Test 2' }]
    ];
    const merged = searchOrchestrator.mergeResults(results);
    return merged.length === 2;
});

test('rankResults adds finalScore', () => {
    const feature = { name: 'Payment', categories: [] };
    const results = [
        { url: 'https://example.com', title: 'Payment Gateway', score: 50 }
    ];
    const ranked = searchOrchestrator.rankResults(results, feature);
    return ranked[0] && 'finalScore' in ranked[0];
});

console.log('\n📦 PHASE 4: DATA LAYER TESTS');
console.log('=' .repeat(80));

// ============================================================================
// WORKSPACE MANAGER TESTS
// ============================================================================
console.log('\n🏢 Workspace Manager Tests');
console.log('-'.repeat(80));

test('Workspace manager exists', () => {
    return typeof workspaceManager !== 'undefined';
});

test('Workspace manager has all core methods', () => {
    const methods = [
        'create', 'update', 'delete', 'getById', 'getAll',
        'loadWorkspaceFeatures', 'countFeatures', 'validate',
        'exists', 'search', 'getStats', 'duplicate',
        'setArchived', 'getActive', 'getArchived', 'sort'
    ];
    return methods.every(m => typeof workspaceManager[m] === 'function');
});

test('Workspace validate works correctly', () => {
    const valid = workspaceManager.validate({ name: 'Test', color: '#3b82f6' });
    const invalid = workspaceManager.validate({ name: '', color: 'invalid' });
    return valid.valid === true && invalid.valid === false;
});

test('Workspace search finds by name', () => {
    const workspaces = [
        { id: '1', name: 'Project Alpha', description: '' },
        { id: '2', name: 'Project Beta', description: '' }
    ];
    const results = workspaceManager.search('alpha', workspaces);
    return results.length === 1 && results[0].name === 'Project Alpha';
});

test('Workspace countFeatures works', () => {
    const features = [
        { id: '1', workspaceId: 'ws1' },
        { id: '2', workspaceId: 'ws1' },
        { id: '3', workspaceId: 'ws2' }
    ];
    const count = workspaceManager.countFeatures('ws1', features);
    return count === 2;
});

test('Workspace getStats returns correct structure', () => {
    const features = [
        { id: '1', workspaceId: 'ws1', status: 'In Progress', priority: 'High' }
    ];
    const stats = workspaceManager.getStats('ws1', features);
    return stats.totalFeatures === 1 &&
           stats.byStatus['In Progress'] === 1 &&
           stats.byPriority['High'] === 1;
});

test('Workspace sort by name works', () => {
    const workspaces = [
        { id: '1', name: 'Zebra', createdAt: new Date().toISOString() },
        { id: '2', name: 'Alpha', createdAt: new Date().toISOString() }
    ];
    const sorted = workspaceManager.sort(workspaces, 'name', 'asc', []);
    return sorted[0].name === 'Alpha' && sorted[1].name === 'Zebra';
});

// ============================================================================
// FEATURE MANAGER TESTS
// ============================================================================
console.log('\n📋 Feature Manager Tests');
console.log('-'.repeat(80));

test('Feature manager exists', () => {
    return typeof featureManager !== 'undefined';
});

test('Feature manager has all core methods', () => {
    const methods = [
        'create', 'update', 'delete', 'getById', 'getByWorkspace', 'getAll',
        'filterByStatus', 'filterByPriority', 'filterByHealth',
        'search', 'sort', 'validate', 'duplicate', 'getStats',
        'exists', 'getByTag', 'getWithActiveBlockers', 'getOverdue'
    ];
    return methods.every(m => typeof featureManager[m] === 'function');
});

test('Feature validate works correctly', () => {
    const valid = featureManager.validate({
        name: 'Test',
        type: 'Feature',
        workspaceId: 'ws1',
        timelineItems: [{ id: '1' }]
    });
    const invalid = featureManager.validate({
        name: '',
        type: '',
        workspaceId: '',
        timelineItems: []
    });
    return valid.valid === true && invalid.valid === false && invalid.errors.length > 0;
});

test('Feature filterByStatus works', () => {
    const features = [
        { id: '1', status: 'In Progress' },
        { id: '2', status: 'Completed' },
        { id: '3', status: 'In Progress' }
    ];
    const filtered = featureManager.filterByStatus('In Progress', features);
    return filtered.length === 2;
});

test('Feature search finds by name', () => {
    const features = [
        { id: '1', name: 'Payment Gateway', purpose: '' },
        { id: '2', name: 'User Dashboard', purpose: '' }
    ];
    const results = featureManager.search('payment', features);
    return results.length === 1 && results[0].name === 'Payment Gateway';
});

test('Feature sort by priority works', () => {
    const features = [
        { id: '1', priority: 'Low', createdAt: new Date().toISOString() },
        { id: '2', priority: 'Critical', createdAt: new Date().toISOString() },
        { id: '3', priority: 'High', createdAt: new Date().toISOString() }
    ];
    const sorted = featureManager.sort(features, 'priority', 'desc');
    return sorted[0].priority === 'Critical' && sorted[2].priority === 'Low';
});

test('Feature getStats returns correct structure', () => {
    const features = [
        { id: '1', status: 'In Progress', priority: 'High', health: 'On Track' },
        { id: '2', status: 'Completed', priority: 'Medium', health: 'On Track' }
    ];
    const stats = featureManager.getStats(features);
    return stats.total === 2 &&
           stats.byStatus['In Progress'] === 1 &&
           stats.byPriority['High'] === 1 &&
           stats.byHealth['On Track'] === 2;
});

test('Feature getWithActiveBlockers works', () => {
    const features = [
        { id: '1', blockers: [{ status: 'active' }] },
        { id: '2', blockers: [{ status: 'resolved' }] },
        { id: '3', blockers: [] }
    ];
    const withBlockers = featureManager.getWithActiveBlockers(features);
    return withBlockers.length === 1 && withBlockers[0].id === '1';
});

test('Feature getOverdue works', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const features = [
        { id: '1', estimatedEndDate: yesterday, status: 'In Progress' },
        { id: '2', estimatedEndDate: tomorrow, status: 'In Progress' },
        { id: '3', estimatedEndDate: yesterday, status: 'Completed' }
    ];
    const overdue = featureManager.getOverdue(features);
    return overdue.length === 1 && overdue[0].id === '1';
});

// ============================================================================
// TIMELINE MANAGER TESTS
// ============================================================================
console.log('\n⏱️  Timeline Manager Tests');
console.log('-'.repeat(80));

test('Timeline manager exists', () => {
    return typeof timelineManager !== 'undefined';
});

test('Timeline manager has all core methods', () => {
    const methods = [
        'addItem', 'updateItem', 'deleteItem', 'getItemById', 'getItems',
        'filterByTimeline', 'filterByDifficulty', 'getStats',
        'reorder', 'validate', 'duplicate'
    ];
    return methods.every(m => typeof timelineManager[m] === 'function');
});

test('Timeline validate works correctly', () => {
    const valid = timelineManager.validate({
        name: 'Test',
        timeline: 'MVP',
        difficulty: 'medium'
    });
    const invalid = timelineManager.validate({
        name: '',
        timeline: 'INVALID',
        difficulty: 'invalid'
    });
    return valid.valid === true && invalid.valid === false;
});

test('Timeline filterByTimeline works', () => {
    const features = [{
        id: 'f1',
        timelineItems: [
            { id: '1', timeline: 'MVP', name: 'Item 1' },
            { id: '2', timeline: 'SHORT', name: 'Item 2' },
            { id: '3', timeline: 'MVP', name: 'Item 3' }
        ]
    }];
    const mvpItems = timelineManager.filterByTimeline('f1', 'MVP', features);
    return mvpItems.length === 2;
});

test('Timeline getStats returns correct structure', () => {
    const features = [{
        id: 'f1',
        timelineItems: [
            { id: '1', timeline: 'MVP', difficulty: 'easy', linkedItems: [] },
            { id: '2', timeline: 'SHORT', difficulty: 'hard', linkedItems: [] }
        ]
    }];
    const stats = timelineManager.getStats('f1', features);
    return stats.total === 2 &&
           stats.byTimeline.MVP === 1 &&
           stats.byDifficulty.easy === 1;
});

// ============================================================================
// LINK MANAGER TESTS
// ============================================================================
console.log('\n🔗 Link Manager Tests');
console.log('-'.repeat(80));

test('Link manager exists', () => {
    return typeof linkManager !== 'undefined';
});

test('Link manager has all core methods', () => {
    const methods = [
        'createLink', 'deleteLink', 'getOutgoingLinks', 'getIncomingLinks',
        'getAllLinks', 'linkExists', 'getStats', 'validate',
        'getDependencies', 'getDependents', 'wouldCreateCircular'
    ];
    return methods.every(m => typeof linkManager[m] === 'function');
});

test('Link validate works correctly', () => {
    const valid = linkManager.validate('source1', 'target1', 'dependency');
    const invalid = linkManager.validate('same', 'same', 'invalid');
    return valid.valid === true && invalid.valid === false;
});

test('Link createLink creates bidirectional links', () => {
    const features = [{
        id: 'f1',
        timelineItems: [
            { id: 'item1', name: 'Item 1', linkedItems: [] },
            { id: 'item2', name: 'Item 2', linkedItems: [] }
        ]
    }];

    const success = linkManager.createLink('f1', 'item1', 'item2', 'dependency', features);

    const outgoing = linkManager.getOutgoingLinks('f1', 'item1', features);
    const incoming = linkManager.getIncomingLinks('f1', 'item2', features);

    return success &&
           outgoing.length === 1 &&
           incoming.length === 1 &&
           outgoing[0].targetId === 'item2' &&
           incoming[0].sourceId === 'item1';
});

test('Link deleteLink removes bidirectional links', () => {
    const features = [{
        id: 'f1',
        timelineItems: [
            { id: 'item1', name: 'Item 1', linkedItems: [
                { targetId: 'item2', direction: 'outgoing', relationshipType: 'dependency' }
            ]},
            { id: 'item2', name: 'Item 2', linkedItems: [
                { sourceId: 'item1', direction: 'incoming', relationshipType: 'dependency' }
            ]}
        ]
    }];

    linkManager.deleteLink('f1', 'item1', 'item2', features);

    const outgoing = linkManager.getOutgoingLinks('f1', 'item1', features);
    const incoming = linkManager.getIncomingLinks('f1', 'item2', features);

    return outgoing.length === 0 && incoming.length === 0;
});

test('Link wouldCreateCircular detects circular dependencies', () => {
    const features = [{
        id: 'f1',
        timelineItems: [
            { id: 'item1', name: 'Item 1', linkedItems: [
                { targetId: 'item2', direction: 'outgoing', relationshipType: 'dependency' }
            ]},
            { id: 'item2', name: 'Item 2', linkedItems: [
                { sourceId: 'item1', direction: 'incoming', relationshipType: 'dependency' }
            ]}
        ]
    }];

    // Adding item2 → item1 would create circular dependency
    const wouldBeCircular = linkManager.wouldCreateCircular('f1', 'item2', 'item1', features);

    return wouldBeCircular === true;
});

test('Link getStats returns correct counts', () => {
    const features = [{
        id: 'f1',
        timelineItems: [
            { id: 'item1', linkedItems: [
                { targetId: 'item2', direction: 'outgoing', relationshipType: 'dependency' }
            ]},
            { id: 'item2', linkedItems: [
                { sourceId: 'item1', direction: 'incoming', relationshipType: 'dependency' }
            ]}
        ]
    }];

    const stats = linkManager.getStats('f1', features);

    return stats.total === 1 && stats.byType.dependency === 1;
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalFailed}`);
console.log(`📈 Total: ${totalPassed + totalFailed}`);
console.log(`📊 Pass Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSING! Phase 3 & Phase 4 are production-ready!');
} else {
    console.log(`\n⚠️ ${totalFailed} test(s) failed:\n`);
    failedTests.forEach((test, i) => {
        console.log(`   ${i + 1}. ${test}`);
    });
}

console.log('\n' + '='.repeat(80));
console.log('✅ Phase 3 & Phase 4 Comprehensive Testing Complete');
console.log('='.repeat(80));
