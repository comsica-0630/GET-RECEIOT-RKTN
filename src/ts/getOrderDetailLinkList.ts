import { ElementHandle, Page } from 'puppeteer';

export const getOrderDetailLinkList = async (
  page: Page,
  pageTotal: number
): Promise<string[]> => {
  const urlList: string[] = [];

  for (let i = 1; i < pageTotal; i++) {
    const url: string = `https://order.my.rakuten.co.jp/?page=myorder&act=list&page_num=${i}`;
    urlList.push(url);
  }

  const orderDetailLinkList: string[] = [];

  for await (const url of urlList) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
      page.goto(url),
    ]);

    //
    const orderDetailLinkListGet: ElementHandle<Element>[] = await page.$$(
      '.oDrDetailList > a'
    );
    if (orderDetailLinkListGet.length === 0) {
      throw new Error('cant access el orderDetailLinkList');
    }

    for await (const orderDetailLink of orderDetailLinkListGet) {
      const href = (await (
        await orderDetailLink.getProperty('href')
      ).jsonValue()) as string;
      orderDetailLinkList.push(href);
    }
  }

  return orderDetailLinkList;
};
