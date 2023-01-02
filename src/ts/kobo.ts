import { readdirSync } from 'fs';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { GetPDFResult } from './getPDF';
import { renemeFile } from './renemeFile';

// *******************************************************
// 楽天Kobo電子書籍ストア
// *******************************************************
export const kobo = async (
  browser: Browser,
  page: Page,
  date: string,
  itemInfoText: string
): Promise<any> => {
  let orderReceiptLinkElBooks: ElementHandle<Element> | null = await page.$(
    `td.changeOrder a`
  );

  // 領収書発行ボタンがなかった場合
  if (orderReceiptLinkElBooks === null) {
    const result: GetPDFResult = {
      isSuccess: false,
      errorInfo: {
        text: '// 領収書発行ボタンがなかった場合',
      },
    };
    return result;
  }

  await page.setDefaultNavigationTimeout(1000 * 120);

  // ダウンロード
  await Promise.all([
    page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    orderReceiptLinkElBooks.click(),
  ]);

  await page.waitForSelector('#recipientText');

  // 宛名テキストボックス
  const inputEl: ElementHandle<Element> | null = await page.$(`#recipientText`);

  // テキストinputがなかった場合
  if (inputEl === null) {
    const result: GetPDFResult = {
      isSuccess: false,
      errorInfo: {
        text: '// テキストinputがなかった場合',
      },
    };
    return result;
  }

  // テキストinputクリア
  await page.$eval(`#recipientText`, (element: any) => (element.value = ''));
  // 会社名入力
  await page.type(`#recipientText`, '合同会社comsica', {
    delay: 300,
  });

  const submitEl: ElementHandle<Element> | null = await page.$(`#submitButton`);

  // 領収書発行ボタンがなかった場合
  if (submitEl === null) {
    const result: GetPDFResult = {
      isSuccess: false,
      errorInfo: {
        text: '// 請求書ページGOない',
      },
    };
    return result;
  }

  try {
    // 領収書発行ボタンクリック
    await Promise.all([page.waitFor(1000 * 30), submitEl.click()]);
  } catch (error) {}

  const clientPDF = await page.target().createCDPSession();
  const downloadPathBooks: string = `./領収書ダウンロードデータ/${date}/tmp`;

  clientPDF.send('Browser.setDownloadBehavior', {
    behavior: 'allow', // ダウンロードを許可
    downloadPath: downloadPathBooks, // ダウンロード先のフォルダを指定
    // eventsEnabled: true,
  });

  await page.reload();

  // ファイル名取得
  const l: string[] = await readdirSync(downloadPathBooks);
  let fileNameOriginal: string = '';
  if (l.length > 0) {
    fileNameOriginal = l[0];
  }

  // リネーム
  const r = await renemeFile(
    `${downloadPathBooks}/${fileNameOriginal}`,
    `${itemInfoText}`
  );

  const result: GetPDFResult = {
    isSuccess: true,
    errorInfo: {
      text: '楽天Kobo電子書籍ストア',
    },
  };
  return result;
};
