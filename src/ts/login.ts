import { Page } from 'puppeteer';

export const login = async (page: Page, url: string, env: any) => {
  // ログインページで移動
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
      page.goto(url),
    ]);
  } catch (error) {
    throw new Error('cant page access');
  }

  // ログイン処理
  try {
    await page.type('input[name="u"]', env.id, {
      delay: 300,
    });
    await page.type('input[name="p"]', env.pass, { delay: 300 });

    await page.waitFor(1000 * 60 * 0.01);

    await Promise.all([
      page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
      page.click('input[type="submit"]'),
    ]);
  } catch (error) {
    throw new Error('cant page access no2');
  }

  // console.log('login ok');
};
