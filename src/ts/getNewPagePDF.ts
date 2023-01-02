import { readdirSync } from 'fs';
import { Browser, ElementHandle } from 'puppeteer';
import { GetPDFResult } from './getPDF';
import { renemeFile } from './renemeFile';

export const getNewPagePDF = async (
  browser: Browser,
  date: string,
  saveFileName: string
): Promise<GetPDFResult> => {
  const pages = await browser.pages();
  let page2;
  page2 = pages[pages.length - 1];
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
        async (params: { state: 'inProgress' | 'completed' | 'canceled' }) => {
          if (params.state == 'completed') {
            // ファイル名取得
            const l: string[] = await readdirSync(downloadPathBooks);

            let fileNameOriginal: string = '';
            if (l.length > 0) {
              fileNameOriginal = l[0];
            }

            // リネーム
            const r = await renemeFile(
              `${downloadPathBooks}/${fileNameOriginal}`,
              `${saveFileName}`
            );

            resolve();
          } else if (params.state == 'canceled') {
            reject('download cancelled');
          }
        }
      );
    });

    await Promise.all([page2.waitFor(1000 * 120), page2.reload()]);

    page2.waitFor(1000 * 120);

    await Promise.race([
      page2.waitFor(1000 * 120),
      page2.reload(),
      downloaded,
      new Promise<boolean>((_resolve, reject) => {
        setTimeout(() => {
          reject('download timed out');
        }, 1000 * 60);
      }),
    ]);

    page2.waitFor(1000 * 120);

    page2.waitForSelector(`#end`);

    const button: ElementHandle<Element> | null = await page2.$(
      `cr-icon-button`
    );

    if (button) {
      await button.click();
    }

    await Promise.race([
      page2.waitFor(1000 * 120),
      page2.reload(),
      downloaded,
      new Promise<boolean>((_resolve, reject) => {
        setTimeout(() => {
          reject('download timed out');
        }, 1000 * 60);
      }),
    ]);

    page2.waitFor(1000 * 120);
  } catch (error) {
    const result: GetPDFResult = {
      isSuccess: false,
      errorInfo: {
        text: '楽天ブックス処理：エラー',
        info: error,
      },
    };
    return result;
  } finally {
    if (page2) {
      page2.close();
    }
  }

  const result: GetPDFResult = {
    isSuccess: false,
    errorInfo: {
      text: '楽天ブックス処理：終了',
    },
  };
  return result;
};
