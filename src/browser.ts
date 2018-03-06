import * as dateFormat from 'dateformat';
import * as fs from 'fs-extra';
import * as path from 'path';

export const throughoutDebug = async (testName, page, browser) => {
    const testId = testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const date = dateFormat(new Date(), 'HH:MM:ss_dd-mm-yyyy');
    const debugFolder = './debug';
    const folder = path.join(debugFolder, testId, date);
    let cleaned = false;

    if (!fs.existsSync(debugFolder)) {
        fs.mkdirSync(debugFolder);
    }

    if (!fs.existsSync(path.join(debugFolder, testId))) {
        fs.mkdirSync(path.join(debugFolder, testId));
    }

    await fs.mkdirSync(folder);
    await page.tracing.start({ path: path.join(folder, 'trace.json'), screenshots: true });

    jasmine.getEnv().addReporter({
        specDone: async (result) => {
            if (result.status == 'failed') {
                if (result.failedExpectations.find(x => x.message.includes('DEFAULT_TIMEOUT_INTERVAL'))) {
                    console.error("Test timed out.");
                }
                await cleanupFailedTask().then(() => {
                    cleaned = true;
                    page.close();
                    browser.close();
                    return console.log("Cleanup finished.");
                }).catch((error) => console.log("Cleanup failed to finish:", error));
            } else {
                await cleanupTask().then(() => {
                    cleaned = true;
                    page.close();
                    browser.close();
                    return console.log("Cleanup finished.");
                }).catch((error) => console.log("Cleanup failed to finish:", error));
            }
        }
    });

    let cleanupTask = async () => {
        console.log("Cleaning...");

        if (cleaned) {
            console.error(`${folder} is already cleaned up!`);
            return;
        }

        fs.removeSync(folder);
    };

    let cleanupFailedTask = async () => {
        console.log("Cleaning...");

        if (cleaned) {
            console.error(`${folder} is already cleaned up!`);
            return;
        }

        await page.tracing.stop();
        await page.screenshot({ path: path.join(folder, 'screenshot.png') });
        await page.content().then((content) => fs.writeFile(path.join(folder, 'page.html'), content));
        await page.evaluate(async () => await document.body.innerHTML)
            .then((html) => fs.writeFile(path.join(folder, 'document.html'), html));
    };
};

export const setViewportAsDesktop = page => {
    page.setViewport({
        width: 1080,
        height: 920
    });
};

export const throughoutSettings = {
    headless: true
};
