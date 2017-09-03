# Throughout ![Travis build status](https://travis-ci.org/Elliot-Evans-95/throughout.svg?branch=master)

End-to-end testing made simple

> Throughout combines [Jest](https://facebook.github.io/jest/) and [Puppeteer](https://github.com/GoogleChrome/puppeteer) to create a FAST End to End testing environment.

## Installation

> *Note: Throughout requires at least Node v6.4.0 due to Puppeteer

To install Throughout using NPM:

```
npm i throughout-chrome
```

To install Throughout using Yarn:

```
yarn add throughout-chrome
```

> **Note**: Puppeteer downloads Chromium.

## Usage

To use Throughout please refer to [Jest's API](https://facebook.github.io/jest/docs/en/api.html) and [Puppeteer's API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#).

Here is an example of a test

```js
const puppeteer = require('puppeteer');
const settings = require(src);
const browserHelper = require(src);

const SITE_URL = 'https://www.pokedex.org/';

describe('Given this is a test', () => {

    let page;
    let browser;
    let debug;

    beforeAll(async () => {
        browser = await puppeteer.launch(settings.browser);
        page = await browser.newPage();
        debug = await browserHelper.debug('Pokedex PWA Test', page);

        await page.goto(SITE_URL);
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

* Uses Headless mode
* Runs a bundled version of Chromium
* Runs tests in parallel

## Contributors

Throughout was made by Myself & [Matt Kemp](https://github.com/techmatt101)
