import { readdirSync, writeFileSync } from 'fs';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { getTextContent } from './getTextContent';
import { kobo } from './kobo';
import { renemeFile } from './renemeFile';

export type GetPDFResult = {
  isSuccess: boolean;
  errorInfo: any;
  url?: string;
};

export const getPDF = async (
  browser: Browser,
  page: Page,
  url: string,
  date: string
): Promise<GetPDFResult> => {
  // console.log('getPDF 注文詳細スタート');

  //ブラウザのダウンロード先をすべて統一する
  const downloadPath: string = `./領収書ダウンロードデータ/${date}/tmp`;
  const client = await page.target().createCDPSession();
  client.send('Browser.setDownloadBehavior', {
    behavior: 'allow', // ダウンロードを許可
    downloadPath: downloadPath, // ダウンロード先のフォルダを指定
  });

  // 詳細ページへ遷移
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
      page.goto(url),
    ]);
  } catch (error) {
    throw new Error('ページ移動失敗');
  }

  // console.log('領収書発行スタート');
  try {
    // 店舗名取得
    const shopName: string = await getTextContent(page, `.shopName > a`);
    // console.log('店舗名', shopName);

    // 店舗名取得
    const prodName: string = await getTextContent(page, `.prodName > a`);
    // console.log('商品名', prodName);

    // 注文日取得
    const orderDate: string = await getTextContent(page, `#orderDate`);
    // console.log('注文日', orderDate);

    let orderDateFix: string = '';
    if (orderDate !== '未定義') {
      // 年
      let splitOrderDate: string[] = orderDate.split('年');
      const yyyy: string = splitOrderDate[0];

      // 月
      splitOrderDate = splitOrderDate[1].split('月');
      const mm = splitOrderDate[0];

      // 日
      splitOrderDate = splitOrderDate[1].split('日');
      const dd = splitOrderDate[0];

      // 日付
      orderDateFix = `${yyyy}_${mm.padStart(2, '0')}${dd.padStart(2, '0')}`;

      // 2021年以前は処理しない
      if (parseInt(yyyy, 10) <= 2021) {
        const result: GetPDFResult = {
          isSuccess: false,
          errorInfo: {
            text: '2021年以前は処理しない',
          },
        };
        return result;
      }
    }
    // console.log('orderDateFix', orderDateFix);

    let itemInfoText = `${orderDateFix}_${prodName.substring(
      0,
      64
    )}@${shopName}.pdf`;
    itemInfoText = itemInfoText.replaceAll('/', '／');
    // console.log('itemInfoText', itemInfoText);

    // *******************************************************
    // 楽天Kobo電子書籍ストア
    // *******************************************************
    if (shopName === '楽天Kobo電子書籍ストア') {
      const r = await kobo(browser, page, date, itemInfoText);
      const result: GetPDFResult = {
        isSuccess: true,
        errorInfo: {
          text: '楽天Kobo電子書籍ストア',
        },
      };

      return result;
    }

    // 領収書発行ボタン取得
    const orderReceiptLinkClass = 'orderReceiptLink';
    let orderReceiptLinkEl: ElementHandle<Element> | null = await page.$(
      `.${orderReceiptLinkClass} > a`
    );

    // *******************************************************
    // 楽天ブックス対応
    // *******************************************************
    // 領収書発行ボタン取得（楽天ブックス）
    const orderReceiptLinkBooks: ElementHandle<Element> | null = await page.$(
      `.status-info.shipped a`
    );

    if (orderReceiptLinkBooks !== null) {
      // console.log('// 楽天ブックス対応');

      // 店舗名取得
      const shopName: string = '楽天ブックス';
      // console.log('店舗名', shopName);

      // 店舗名取得
      const prodName: string = await getTextContent(page, '.item-detail a');
      // console.log('商品名', prodName);

      // 注文日取得
      let orderDate: string = await getTextContent(page, '.order-info > div');
      orderDate = orderDate.trim();
      // console.log('注文日', orderDate);

      let orderDateFix: string = '';
      if (orderDate !== '未定義') {
        // 年
        let splitOrderDate: string[] = orderDate.split('年');
        const yyyy: string = splitOrderDate[0];

        // 月
        splitOrderDate = splitOrderDate[1].split('月');
        const mm = splitOrderDate[0];

        // 日
        splitOrderDate = splitOrderDate[1].split('日');
        const dd = splitOrderDate[0];

        // 日付
        orderDateFix = `${yyyy}_${mm.padStart(2, '0')}${dd.padStart(2, '0')}`;

        // 2021年以前は処理しない
        if (parseInt(yyyy, 10) <= 2021) {
          const result: GetPDFResult = {
            isSuccess: false,
            errorInfo: {
              text: '2021年以前は処理しない',
            },
          };
          return result;
        }
      }
      // console.log('orderDateFix', orderDateFix);

      let itemInfoText = `${orderDateFix}_${prodName.substring(
        0,
        64
      )}@${shopName}.pdf`;
      itemInfoText = itemInfoText.replaceAll('/', '／');
      // console.log('itemInfoText', itemInfoText);

      // 領収書発行ボタン取得
      if (orderReceiptLinkBooks === null) {
        throw new Error('orderReceiptLinkBooks === null');
      }

      // ページ遷移
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
          orderReceiptLinkBooks.click(),
        ]);
        page.waitFor(1000 * 5);
      } catch (error) {
        throw new Error('ページ遷移エラー？');
      }

      // テキストinputクリア
      await page.$eval(
        `input[name="customerName"]`,
        (element: any) => (element.value = '')
      );

      // 会社名入力
      await page.type(`input[name="customerName"]`, '合同会社comsica', {
        delay: 300,
      });

      const submitEl: ElementHandle<Element> | null = await page.$(
        `input[type="submit"]`
      );

      // 領収書発行ボタンがなかった場合
      if (submitEl === null) {
        throw new Error('サブミットない');
      }

      // タブひらく
      await Promise.all([page.waitFor(1000 * 60 * 0.3), submitEl.click()]);

      const pages = await browser.pages();

      let page2;
      page2 = pages[pages.length - 1];

      await page2.setDefaultNavigationTimeout(0);

      try {
        const clientPDF = await page2.target().createCDPSession();
        const downloadPathBooks: string = `./領収書ダウンロードデータ/${date}/tmp`;
        clientPDF.send('Browser.setDownloadBehavior', {
          behavior: 'allow', // ダウンロードを許可
          downloadPath: downloadPathBooks, // ダウンロード先のフォルダを指定
          eventsEnabled: true,
        });

        //PDFを強制ダウンロードする設定を有効化
        await clientPDF.send('Fetch.enable', {
          patterns: [
            {
              urlPattern: '*',
              requestStage: 'Response',
            },
          ],
        });

        await clientPDF.on('Fetch.requestPaused', async (reqEvent) => {
          const { requestId } = reqEvent;

          let responseHeaders = reqEvent.responseHeaders || [];
          let contentType = '';

          for (let elements of responseHeaders) {
            if (elements.name.toLowerCase() === 'content-type') {
              contentType = elements.value;
            }
          }

          //PDFとXMLは対象とする
          if (contentType.endsWith('pdf') || contentType.endsWith('xml')) {
            //content-disposition: attachmentヘッダーを追加する
            responseHeaders.push({
              name: 'content-disposition',
              value: 'attachment',
            });

            const responseObj = await clientPDF.send('Fetch.getResponseBody', {
              requestId,
            });

            await clientPDF.send('Fetch.fulfillRequest', {
              requestId,
              responseCode: 200,
              responseHeaders,
              body: responseObj.body,
            });
          } else {
            await clientPDF.send('Fetch.continueRequest', { requestId });
          }
        });

        const downloaded = new Promise<void>((resolve, reject) => {
          clientPDF.on(
            'Browser.downloadProgress',
            async (params: {
              state: 'inProgress' | 'completed' | 'canceled';
            }) => {
              if (params.state == 'completed') {
                // リネーム
                const r = await renemeFile(
                  `${downloadPathBooks}/receiptPrint.pdf`,
                  `${itemInfoText}`
                );

                resolve();
              } else if (params.state == 'canceled') {
                reject('download cancelled');
              }
            }
          );
        });

        await Promise.race([
          page2.reload(),
          downloaded,
          new Promise<boolean>((_resolve, reject) => {
            setTimeout(() => {
              reject('download timed out');
            }, 50000);
          }),
        ]);

        // リネーム
        const r = await renemeFile(
          `${downloadPathBooks}/receiptPrint.pdf`,
          `${itemInfoText}`
        );

        const result: GetPDFResult = {
          isSuccess: true,
          errorInfo: {
            text: '楽天ブックス処理：終了',
          },
        };
        return result;
      } catch (error) {
        throw new Error('楽天ブックス処理：エラー');
      }
    }

    // *******************************************************
    // 楽天ブックスでない＆領収書発行ボタンがなかった場合
    // *******************************************************
    if (orderReceiptLinkEl === null) {
      // disableのボタンを取得してみる
      orderReceiptLinkEl = await page.$(`button.receiptDisabled`);

      // disableのボタンもなかったらエラー
      if (orderReceiptLinkEl === null) {
        const result: GetPDFResult = {
          isSuccess: false,
          errorInfo: {
            text: 'disableのボタンもなかったらエラー',
          },
        };
        return result;
      }

      // 有効な領収書発行ボタンがないものはいったん終了
      const result: GetPDFResult = {
        isSuccess: false,
        errorInfo: {
          text: '有効な領収書発行ボタンがないものはいったん終了',
        },
      };
      return result;
    }

    // console.log('通常のPDFダウンロード実行');

    // PDFダウンロード実行
    await Promise.all([page.waitFor(1000 * 5), orderReceiptLinkEl.click()]);

    // ファイル名取得
    const l: string[] = await readdirSync(downloadPath);

    let fileNameOriginal: string = '';
    if (l.length > 0) {
      fileNameOriginal = l[0];
    }
    // console.log('fileNameOriginal', fileNameOriginal);

    // リネーム？
    const r = await renemeFile(
      `${downloadPath}/${fileNameOriginal}`,
      `${itemInfoText}`
    );
  } catch (error) {
    // console.log('領収書発行失敗');
    // console.log(error);

    const result: GetPDFResult = {
      isSuccess: false,
      errorInfo: {
        text: '領収書発行失敗',
        info: error,
      },
    };
    return result;
  }

  const result: GetPDFResult = {
    isSuccess: true,
    errorInfo: {
      text: '正常終了',
    },
  };
  return result;
};
