import { BrowserSet } from './types/object';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { format } from 'date-fns';

import { env } from './env';
import { getOrderDetailLinkList } from './ts/getOrderDetailLinkList';
import { getPDF, GetPDFResult } from './ts/getPDF';
import { login } from './ts/login';

// メイン関数
const main = async (browserSet: BrowserSet) => {
  let browser: Browser = browserSet.browser;
  let page: Page = browserSet.page;

  try {
    try {
      // ログイン処理
      const url =
        'https://grp01.id.rakuten.co.jp/rms/nid/vc?__event=login&service_id=top';
      await login(page, url, env);
    } catch (error) {
      // console.log('ログイン処理catch');
    }

    // 購入履歴へ
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        page.waitForSelector('a[aria-label="購入履歴"]'),
        page.click('a[aria-label="購入履歴"]'),
      ]);
    } catch (error) {
      console.log('cant page access 購入履歴');
      throw new Error('cant page access 購入履歴');
    }

    // console.log('購入履歴ページへ遷移 OK');

    // ページ数取得
    let pageTotal: number = 0;
    try {
      //
      const totalItemEl: ElementHandle<Element> | null = await page.$(
        'span.totalItem'
      );
      if (!totalItemEl) {
        throw new Error('cant access el');
      }
      const totalItemText = (await (
        await totalItemEl.getProperty('textContent')
      ).jsonValue()) as string;
      // console.log(totalItemText);

      pageTotal = Math.ceil(parseInt(totalItemText, 10) / 25);
      // console.log(pageTotal);
    } catch (error) {}

    // 注文詳細リンク取得
    let orderDetailLinkList: string[] = [];
    try {
      const orderDetailLinkListTmp: string[] = await getOrderDetailLinkList(
        page,
        pageTotal
      );
      // console.log('orderDetailLinkList', orderDetailLinkListTmp);
      orderDetailLinkList = orderDetailLinkList.concat(orderDetailLinkListTmp);
    } catch (error) {}

    // console.log('注文詳細スタート');
    let results: GetPDFResult[] = [];
    try {
      const date = format(new Date(), 'yyyy-MM-dd_HHmmss');
      for await (const url of orderDetailLinkList) {
        const result: GetPDFResult = await getPDF(browser, page, url, date);
        result.url = url;
        results.push(result);
      }
    } catch (error) {
      // console.log('getpdf err');
      // console.log(error);
      throw new Error('getpdf err');
    }
    // console.log('results');
    // console.log(results);

    const sucessResults = results.filter((v: GetPDFResult) => {
      return v.isSuccess === true;
    });

    console.log('サンプル数');
    console.log(orderDetailLinkList.length);

    console.log('成功');
    console.log(sucessResults.length);

    console.log('失敗');
    console.log(orderDetailLinkList.length - sucessResults.length);
  } catch (err) {
    // エラーが起きた際の処理
    console.log('エラー error');
    console.log(err);
    if (browser) {
      await browser.close();
    }

    return false;
  } finally {
    console.log('処理おわり');
    if (browser) {
      await browser.close();
    }

    process.exit();
    // return 0;
  }
};

export default main;
