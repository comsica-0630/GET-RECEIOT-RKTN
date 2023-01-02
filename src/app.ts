import main from './main';
import browserInit from './ts/browserInit';
import pageInit from './ts/pageInit';
import { BrowserSet } from './types/object';
import { Browser } from 'puppeteer';

const run = async () => {
  console.log(new Date().toLocaleString());

  // ブラウザ起動
  let browser: Browser | undefined = await browserInit();
  if (!browser) {
    // console.log('browser new error');
    return;
  }
  let browserSet: BrowserSet | undefined = await pageInit(browser);
  if (!browserSet) {
    // console.log('browserSet new error');
    return;
  }

  main(browserSet);
};

run();
