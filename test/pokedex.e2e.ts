import * as puppeteer from 'puppeteer';
import { throughoutSettings, throughoutDebug, setViewportAsDesktop } from '../src/browser';
import { urlList } from '../testBed/url';

describe('Given this is a test', () => {

    let page;
    let browser;
    let debug;

    beforeAll(async () => {
        browser = await puppeteer.launch(throughoutSettings);
        page = await browser.newPage();
        debug = await throughoutDebug('Pokedex PWA Test', page, browser);
        setViewportAsDesktop(page);

        await page.goto(urlList.POKEMON);
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
        // page.close();
        // browser.close();
    });
});
