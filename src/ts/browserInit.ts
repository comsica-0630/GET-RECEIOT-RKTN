import puppeteer, { Browser } from 'puppeteer';

const browserInit = async (): Promise<Browser | undefined> => {
  let browser: Browser;

  try {
    // プラウザ起動
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--window-size=1000,800'],
    });
  } catch (err) {
    if (browser!) {
      await browser.close();
    }
    return undefined;
  }
  return browser;
};

export default browserInit;
