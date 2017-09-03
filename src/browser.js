const dateFormat = require('dateformat');
const date = dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss');
const debugFolder = './debug';
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    debug,
    settings: { headless: false }
};

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

async function debug(testName, page) {
    let testId = testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    let folder = path.join(debugFolder, testId, date);
    let hasFailed = false;
    let errors = [];

    if (!fs.existsSync(path.join(debugFolder, testId))) {
        fs.mkdirSync(path.join(debugFolder, testId));
    }

    fs.mkdirSync(folder);

    await page.tracing.start({path: path.join(folder, 'trace.json'), screenshots: true});

    jasmine.getEnv().addReporter({
        specDone: (result) => {
            hasFailed = result.status === 'failed';
            if (hasFailed) {
                errors.push({
                    type: 'test',
                    message: 'Test failed ' + result.fullName,
                    data: () => JSON.stringify(result.failedExpectations, null, '\t')
                });
            }
        }
    });

    page.on('error', (error) => {
        console.error(error);
        errors.push({
            type: 'console',
            message: error
        });
    });

    page.on('pageerror', (message) => {
        console.error(message);
        errors.push({
            type: 'page',
            message: safeJsonStringify(message)
        });
    });

    page.on('requestfailed', (request) => {
        let response = request.response();
        console.error(`NETWORK ERROR: ${response.status} ${request.url}`);
        errors.push({
            type: 'request',
            message: 'Network error',
            data: async () => {
                let data = await response.text();
                return `Request: ${safeJsonStringify(request)}\nResponse: ${safeJsonStringify(response)}\nJSON: ${data}`;
            }
        });
    });

    return {
        hasErrors: function () {
            return errors.length > 0;
        },
        cleanup: async () => {
            try {
                await page.tracing.stop();

                if (hasFailed) {
                    let content = await page.content();
                    let html = await page.evaluate(() => Promise.resolve(document.body.innerHTML));
                    let errorMessages = await Promise.all(errors.map(async error => {
                        let data = error.data ? (await error.data()) : '';
                        return `[${error.type} error] ${error.message} => ${data}`;
                    }));
                    await fs.writeFile(path.join(folder, 'page.html'), content);
                    await fs.writeFile(path.join(folder, 'document.html'), html);
                    await fs.writeFile(path.join(folder, 'console-errors.txt'), errorMessages.join('\n'));
                    await page.screenshot({path: path.join(folder, 'screenshot.png')});
                }
                else {
                    await fs.unlink(path.join(folder, 'trace.json'));
                    await fs.rmdir(folder);
                }
            } catch (e) {
                console.error("cleanup failed.", e);
                await fs.writeFile(path.join(folder, 'cleanup-error.txt'), e);
            }
        }
    }
}
