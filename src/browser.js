const dateFormat = require('dateformat');
const fs = require('fs-extra');
const path = require('path');
const date = dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss');
const debugFolder = './debug';

if (!fs.existsSync(debugFolder)) {
    fs.mkdirSync(debugFolder);
}

function safeJsonStringify(request) {
    try {
        return JSON.stringify(request, Object.keys(request).filter(x => x[0] !== '_'), '\t')
    }
    catch (e) {
        return request;
    }
}

const ErrorLevels = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
};

async function debug(testName, page) {
    let testId = testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    let folder = path.join(debugFolder, testId, date);
    let hasFailed = false;
    let cleaned = false;
    let errors = [];

    if (!fs.existsSync(path.join(debugFolder, testId))) {
        fs.mkdirSync(path.join(debugFolder, testId));
    }

    fs.mkdirSync(folder);

    await page.tracing.start({ path: path.join(folder, 'trace.json'), screenshots: true });

    let cleanupTask = async () => {
        if (cleaned) {
            console.error(`WARNING: ALL READY CLEANED UP ${folder}`);
            return;
        }
        cleaned = true;

        if (hasFailed) {
            console.log(`DEBUG INFO: ${folder}`);

            try {
                let buildErrorMessages = Promise.all(errors.map(async error => {
                    let data = error.data ? (await error.data()) : '';
                    return `[${error.type} ${error.level}] ${error.message} => ${data}`;
                }));
                await Promise.all([
                    buildErrorMessages.then((messages) => fs.writeFile(path.join(folder, 'console-errors.txt'), messages.join('\n'))),
                    page.tracing.stop(),
                    page.screenshot({ path: path.join(folder, 'screenshot.png') }),
                    page.content().then((content) => fs.writeFile(path.join(folder, 'page.html'), content)),
                    page.evaluate(() => Promise.resolve(document.body.innerHTML)).then((html) => fs.writeFile(path.join(folder, 'document.html'), html)),
                ]);
            } catch (e) {
                console.error('ERROR: FAILED TO DEBUG FAILING TEST', e);
                fs.writeFileSync(path.join(debugFolder, `cleanup-error-${date}.txt`), e);
            }
        }
        else {
            try {
                await page.tracing.stop();
                await fs.unlink(path.join(folder, 'trace.json'));
                await fs.rmdir(folder);
            } catch (e) {
                console.error('ERROR: FAILED TO CLEAN UP', e);
                fs.writeFileSync(path.join(debugFolder, `cleanup-error-${date}.txt`), e);
            }
        }
    };

    jasmine.getEnv().addReporter({
        specDone: (result) => {
            hasFailed = result.status === 'failed';
            if (hasFailed) {
                try {
                    errors.push({
                        type: 'test',
                        level: ErrorLevels.ERROR,
                        message: 'Test failed ' + result.fullName,
                        data: () => JSON.stringify(result.failedExpectations, null, '\t')
                    });
                    if (result.failedExpectations.find(x => x.message.includes('DEFAULT_TIMEOUT_INTERVAL'))) {
                        console.error("Test timed out");
                        cleanupTask().then(() => console.log("Forced Cleanup")).catch(() => console.log("Cleanup failed"));
                    }
                }
                catch (e) {
                    console.error('Failed to report ERROR', e);
                }
            }
        }
    });

    page.on('console', (error) => {
        console.info('CONSOLE LOG', error);
        errors.push({
            type: 'console',
            level: ErrorLevels.INFO,
            message: error
        });
    });

    page.on('error', (error) => {
        console.error('BROWSER ERROR', error);
        errors.push({
            type: 'console',
            level: ErrorLevels.ERROR,
            message: error
        });
    });

    page.on('pageerror', (message) => {
        console.error('PAGE ERROR', message);
        errors.push({
            type: 'page',
            level: ErrorLevels.ERROR,
            data: () => safeJsonStringify(message)
        });
    });

    page.on('response', (response) => {
        if (!response.ok && !(response.status >= 300 && response.status < 400)) {
            console.error('NETWORK ERROR', `${response.status} ${response.url}`);
            errors.push({
                type: 'network',
                level: ErrorLevels.WARN,
                message: 'Network error',
                data: () => response.text()
                    .then(data => `Request: ${safeJsonStringify(response)}\nJSON: ${data}`)
            });
        }
    });

    return {
        hasErrors: () => !!errors.find(x => x.level === ErrorLevels.ERROR),
        cleanup: cleanupTask
    }
}

function setDesktopDefaults(page) {
    page.setViewport({ width: 1080, height: 920 });
}

module.exports = {
    debug,
    setDesktopDefaults,
    settings: { headless: true }
};
