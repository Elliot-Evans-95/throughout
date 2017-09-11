const puppeteer = require('puppeteer');
const browserHelper = require('../src/browser');
const url = require('../testBed/url');

describe('Given this is a test', () => {

    let page;
    let browser;
    let debug;

    beforeAll(async () => {
        browser = await puppeteer.launch(settings.browser);
        page = await browser.newPage();
        debug = await browserHelper.debug('Pokedex PWA Test', page);

        await page.goto(url.POKEMON);
    });

    describe('When the user clicks the pokemon link', () => {

        beforeAll(async () => {
            await page.click('#pokemon-link');
        });

        it('Then the pokemon list should be visible', async () => {
            expect(await page.$('#monsters-list')).toBeTruthy();
        });
    });

    afterAll(async () => {
        await debug.cleanup();
        browser.close();
    });
});
