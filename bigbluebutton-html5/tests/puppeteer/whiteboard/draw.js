const Page = require('../core/page');
const e = require('./elements');

class Draw extends Page {
  constructor() {
    super('whiteboard-draw');
  }

  async test() {
    await this.waitForSelector(e.tools);
    await this.click(e.tools);
    await this.waitForSelector(e.rectangle);
    await this.click(e.rectangle);
    await this.waitForSelector(e.whiteboard);

    const shapes0 = await this.getTestElements();

    const wb = await this.page.$(e.whiteboard);
    const wbBox = await wb.boundingBox();
    await this.page.mouse.move(wbBox.x + 0.3 * wbBox.width, wbBox.y + 0.3 * wbBox.height);
    await this.page.mouse.down();
    await this.page.mouse.move(wbBox.x + 0.7 * wbBox.width, wbBox.y + 0.7 * wbBox.height);
    await this.page.mouse.up();

    await this.screenshot(true);
    await this.waitForSelector(e.drawnRectangle);
    const shapes1 = await this.getTestElements();

    console.log('\nShapes before drawing box:');
    console.log(shapes0);
    console.log('\nShapes after drawing box:');
    console.log(shapes1);

    return shapes0 !== shapes1;
  }

  async getTestElements() {
    await this.waitForSelector('g[clip-path="url(#viewBox)"]');
    const shapes = await this.page.evaluate(() => document.querySelector('svg g[clip-path]').children[1].outerHTML);
    return shapes;
  }
}

module.exports = exports = Draw;
