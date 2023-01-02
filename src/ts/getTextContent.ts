import { ElementHandle, Page } from 'puppeteer';

export const getTextContent = async (
  page: Page,
  selector: string
): Promise<string> => {
  // テキスト取得
  let text: string = '';
  let el: ElementHandle<Element> | null = await page.$(selector);

  // DOMから店舗名取得
  if (el === null) {
    text = '未定義';
  } else {
    text = await (await el.getProperty('textContent')).jsonValue();
  }

  return text;
};
