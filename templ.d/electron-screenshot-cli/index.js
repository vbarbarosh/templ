const cli = require('@vbarbarosh/node-helpers/src/cli');
const electron = require('electron');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');

cli(main);

async function main()
{
    await electron.app.whenReady();

    const display = electron.screen.getPrimaryDisplay();
    const width = display.size.width*display.scaleFactor;
    const height = display.size.height*display.scaleFactor;

    const sources = await electron.desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {width, height},
    });
    await fs_write('a.png', sources[0].thumbnail.toPNG());

    await electron.app.quit();
    console.log('🎉 Done');
}
