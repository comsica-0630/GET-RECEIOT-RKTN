import { format } from 'date-fns';
import { Browser, Page } from 'puppeteer';
import { BrowserSet } from '../types/object';

// pageをinit
const pageInit = async (browser: Browser): Promise<BrowserSet | undefined> => {
  // console.log('pageInit');

  let page: Page;

  try {
    page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 6000 });
    await page.setDefaultNavigationTimeout(1000 * 60 * 5);
  } catch (err) {
    // エラーが起きた際の処理
    // console.log('pageInit init error');
    // console.log(err);
    if (browser) {
      await browser.close();
    }
    return undefined;
  } finally {
    // console.log('pageInit init end');
  }
  return {
    browser: browser,
    page: page,
  };
};

export default pageInit;
