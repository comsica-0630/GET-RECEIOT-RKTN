import { copyFileSync, existsSync, unlinkSync } from 'fs';

// 一時ファイルをリネームする
export const renemeFile = async (
  originalFilePath: string,
  renameFileName: string
): Promise<number> => {
  const filePath = originalFilePath;

  const pathSplit: string[] = filePath.split('/');
  const originalFileName: string = pathSplit[pathSplit.length - 1];

  let filePathRename = filePath.replaceAll('tmp/', '');
  filePathRename = filePathRename.replaceAll(originalFileName, renameFileName);

  try {
    if ((await existsSync(filePath)) === false) {
      throw new Error('ファイルないエラー');
    }
  } catch (error) {
    // console.log(error);
    return -1;
  }

  try {
    await copyFileSync(filePath, filePathRename);
  } catch (error) {
    // console.log('*********** ERROR：ファイルリネーム失敗 ***********');

    return -1;
  }

  // デリート
  try {
    await unlinkSync(filePath);
  } catch (error) {
    // console.log('ファイル削除失敗');
    return -1;
  }
  // console.log('ファイルリネーム成功');

  return 0;
};
