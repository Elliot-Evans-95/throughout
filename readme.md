# Throughout

### End-to-end testing made simple

> Throughout combines [Jest](https://facebook.github.io/jest/) and [Puppeteer](https://github.com/GoogleChrome/puppeteer) to create a FAST End to End testing environment.

## Installation

> *Note: Throughout requires at least Node v6.4.0 due to Puppeteer

To use Throughout in your project, run:
```
yarn add throughout
npm i throughout
```

> **Note**: Puppeteer downloads Chromium.

## Usage

To use Throughout please refer to [Jest's API](https://facebook.github.io/jest/docs/en/api.html) and [Puppeteer's API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#).

Here is an example of a test

```js
const puppeteer = require('puppeteer');
const settings = require('../helpers/settings');
const browserHelper = require('../helpers/browser');

const CONTROL_PANEL_URL = 'https://www.pokedex.org/';

describe('Given this is a test', () => {

    let page;
    let browser;
    let debug;

    beforeAll(async () => {
        browser = await puppeteer.launch(settings.browser);
        page = await browser.newPage();
        debug = await browserHelper.debug('Pokedex PWA Test', page);

        await page.goto(CONTROL_PANEL_URL);
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
```

## Default settings

**1. Uses Headless mode**
**2. Runs a bundled version of Chromium**
**3. Runs tests in parallel**

## Contributors

Throughout was made by Myself & [Matt Kemp](https://github.com/techmatt101)
