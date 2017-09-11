class SimpleReporter {
    onRunComplete(contexts, results) {
        console.log(`\n`);
        if (results.numFailedTests === 0) {
            console.log(`TESTS PASSED (${results.numPassedTests})`);
            return;
        }

        for (let test of results.testResults) {
            for (let result of test.testResults) {
                if (result.status === 'failed') {
                    console.error(` TEST FAILED: ${result.fullName}`);
                    console.log(` FILE: ${test.testFilePath}`);
                    console.log(`\n`);
                    console.log(result.failureMessages.join('\n'));
                    console.log(`\n\n`);
                }
            }
        }

        console.error(`! TESTS FAILED (${results.numFailedTests} of ${results.numTotalTests})`);
    }
}

module.exports = SimpleReporter;
