const path = require('path');
const Page = require('../core/page');
const params = require('../params');
const helper = require('../core/helper');
const cpe = require('./elements');
const util = require('./util');
const c = require('./constants');

class CustomParameters {
  constructor() {
    this.page1 = new Page();
    this.page2 = new Page();
    this.name = name;
    this.screenshotIndex = 0;
    this.parentDir = this.getParentDir(__dirname);
  }

  getParentDir(dir) {
    const tmp = dir.split('/');
    tmp.pop();
    return tmp.join('/');
  }

  async autoJoin(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.waitForSelector('div[data-test="chatMessages"]', { timeout: 5000 });
    if (await this.page1.page.evaluate(util.getTestElement, cpe.audioModal) === false) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.audioModal) === true;
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async listenOnlyMode(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Attendee', moderatorPW: '' }, customParameter, testName);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    this.page1.logger('after init ', testName);
    if (await this.page2.page.$('[data-test="audioModalHeader"]')) {
      await this.page2.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.page.waitFor(cpe.echoTestYesButton);
    await this.page1.screenshot(`${testName}`, `02-success-page1-${testName}`);
    await this.page2.page.waitFor(cpe.echoTestYesButton);
    await this.page2.screenshot(`${testName}`, `02-success-page2-${testName}`);
    const resp1 = await util.listenOnlyMode(this.page1);
    await this.page1.screenshot(`${testName}`, `03-success-page1-${testName}`);
    const resp2 = await util.listenOnlyMode(this.page2);
    await this.page2.screenshot(`${testName}`, `03-success-page2-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp1 === true && resp2 === true;
  }

  async forceListenOnly(testName, args, meetingId, customParameter) {
    this.page2.logger('before init ', testName);
    await this.page2.init(args, meetingId, { ...params, fullName: 'Attendee', moderatorPW: '' }, customParameter, testName);
    await this.page2.screenshot(`${testName}`, `01-${testName}`);
    this.page2.logger('after init ', testName);
    if (await this.page2.page.$('[data-test="audioModalHeader"]')) {
      await this.page2.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page2.logger(testName, ' failed');
      return false;
    }
    await this.page2.waitForSelector(cpe.audioNotification);
    await this.page2.screenshot(`${testName}`, `02-success-${testName}`);
    const resp = await util.forceListenOnly(this.page2);
    await this.page2.screenshot(`${testName}`, `03-success-${testName}`);
    this.page2.logger(testName, ' passed');
    return resp === true;
  }

  async skipCheck(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    this.page1.logger('connecting with microphone');
    await this.page1.joinMicrophoneWithoutEchoTest();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.elementRemoved('div[class^="connecting--"]');
    await this.page1.screenshot(`${testName}`, `03-${testName}`);
    this.page1.logger('before if condition');
    if (await this.page1.page.evaluate(util.countTestElements, cpe.echoTestYesButton) === true) {
      await this.page1.screenshot(`${testName}`, `04-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.countTestElements, cpe.echoTestYesButton) === false;
    await this.page1.screenshot(`${testName}`, `04-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async clientTitle(testName, args, meetingId, customParameter) {
    testName = 'clientTitle';
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.waitForSelector('button[aria-label="Microphone"]');
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    if (await !(await this.page1.page.title()).includes(c.docTitle)) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await (await this.page1.page.title()).includes(c.docTitle);
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async askForFeedbackOnLogout(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.logoutFromMeeting();
    await this.page1.screenshot(`${testName}`, `03-${testName}`);
    await this.page1.waitForSelector(cpe.meetingEndedModal);
    await this.page1.screenshot(`${testName}`, `04-${testName}`);
    this.page1.logger('audio modal closed');
    if (await this.page1.page.evaluate(util.countTestElements, cpe.rating) === false) {
      await this.page1.screenshot(`${testName}`, `05-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.countTestElements, cpe.rating) === true;
    await this.page1.screenshot(`${testName}`, `05-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async displayBrandingArea(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    this.page1.logger('audio modal closed');
    await this.page1.waitForSelector('div[data-test="userListContent"]');
    if (await this.page1.page.evaluate(util.countTestElements, cpe.brandingAreaLogo) === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.countTestElements, cpe.brandingAreaLogo) === true;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async shortcuts(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    this.page1.logger('audio modal closed');
    await this.page1.waitForSelector('button[aria-label="Options"]');
    await this.page1.page.keyboard.down('Alt');
    await this.page1.page.keyboard.press('O');
    if (await this.page1.page.evaluate(util.getTestElement, cpe.verticalListOptions) === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.verticalListOptions) === true;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async enableScreensharing(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    if (await this.page1.page.evaluate(util.getTestElement, cpe.screenShareButton) === false) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.screenShareButton) === true;
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async enableVideo(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    if (await this.page1.page.evaluate(util.getTestElement, cpe.shareWebcamButton) === false) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.shareWebcamButton) === true;
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async autoShareWebcam(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    if (await this.page1.page.evaluate(util.getTestElement, cpe.webcamSettingsModal) === true) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.webcamSettingsModal) === false;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async multiUserPenOnly(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Moderator2' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page2.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `02-page2-${testName}`);
    await this.page1.waitForSelector(cpe.multiUsersWhiteboard);
    await this.page1.click(cpe.multiUsersWhiteboard, true);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.waitForSelector(cpe.tools);
    await this.page2.click(cpe.tools, true);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    if (await this.page2.page.evaluate(async () => await document.querySelectorAll('[aria-label="Tools"]')[0].parentElement.childElementCount === 2)) {
      await this.page2.screenshot(`${testName}`, `05-page2-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page2.page.evaluate(async () => await document.querySelectorAll('[aria-label="Tools"]')[0].parentElement.childElementCount === 1);
    await this.page2.screenshot(`${testName}`, `05-page2-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async presenterTools(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.tools);
    await this.page1.click(cpe.tools, true);
    await this.page1.screenshot(`${testName}`, `03-${testName}`);
    if (await this.page1.page.evaluate(async () => await document.querySelectorAll('[aria-label="Tools"]')[0].parentElement.querySelector('[class^="toolbarList--"]').childElementCount === 7)) {
      await this.page1.screenshot(`${testName}`, `04-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(async () => await document.querySelectorAll('[aria-label="Tools"]')[0].parentElement.querySelector('[class^="toolbarList--"]').childElementCount === 2);
    await this.page1.screenshot(`${testName}`, `04-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async multiUserTools(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Moderator2' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page2.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `02-page2-${testName}`);
    await this.page1.waitForSelector(cpe.multiUsersWhiteboard);
    await this.page1.click(cpe.multiUsersWhiteboard, true);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.waitForSelector(cpe.tools);
    await this.page2.click(cpe.tools, true);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    if (await this.page2.page.evaluate(async () => await document.querySelectorAll('[aria-label="Tools"]')[0].parentElement.querySelector('[class^="toolbarList--"]').childElementCount === 7)) {
      await this.page2.screenshot(`${testName}`, `05-page2-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page2.page.evaluate(async () => await document.querySelectorAll('[aria-label="Tools"]')[0].parentElement.querySelector('[class^="toolbarList--"]').childElementCount === 2);
    await this.page2.screenshot(`${testName}`, `05-page2-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async customStyle(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.whiteboard);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const isHidden = await this.page1.page.$eval('[class="presentationTitle--1LT79g"]', elem => elem.offsetHeight == 0);
    if (isHidden === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    } if (isHidden === true) {
      await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
      const resp = isHidden;
      this.page1.logger(testName, ' passed');
      return resp === true;
    }
  }

  async customStyleUrl(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.whiteboard);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const isHidden = await this.page1.page.$eval('[class="presentationTitle--1LT79g"]', elem => elem.offsetHeight == 0);
    if (isHidden === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    } if (isHidden === true) {
      await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
      const resp = isHidden;
      this.page1.logger(testName, ' passed');
      return resp === true;
    }
  }

  async autoSwapLayout(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.container);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const isNotHidden = await this.page1.page.$eval(cpe.restorePresentation, elem => elem.offsetHeight !== 0);
    console.log(isNotHidden);
    if (isNotHidden === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    } if (isNotHidden === true) {
      await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
      const resp = isNotHidden;
      this.page1.logger(testName, ' passed');
      return resp === true;
    }
  }

  async hidePresentation(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.actions);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    if (await this.page1.page.evaluate(util.countTestElements, cpe.defaultContent) === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.countTestElements, cpe.defaultContent) === true;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async bannerText(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.actions);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    if (await this.page1.page.evaluate(util.countTestElements, cpe.notificationBar) === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.countTestElements, cpe.notificationBar) === true;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async bannerColor(testName, args, meetingId, customParameter, colorToRGB) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.notificationBar);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const notificationBarColor = await this.page1.page.$eval('div[class^="notificationsBar--"]', elem => getComputedStyle(elem).backgroundColor);
    console.log('colorToRGB => ', colorToRGB);
    console.log('notificationBarColor => ', notificationBarColor);
    if (notificationBarColor !== colorToRGB) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    } if (notificationBarColor === colorToRGB) {
      await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
      this.page1.logger(testName, ' passed');
      return true;
    }
  }

  async hideAndSwapPresentation(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.container);
    if (await this.page1.page.evaluate(util.countTestElements, cpe.restorePresentation) === false && await this.page1.page.evaluate(util.countTestElements, cpe.defaultContent) === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.countTestElements, cpe.restorePresentation) === true && await this.page1.page.evaluate(util.countTestElements, cpe.defaultContent) === true;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async showPublicChatOnLogin(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.container);
    if (await this.page1.page.evaluate(util.countTestElements, cpe.chat) === true) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.countTestElements, cpe.chat) === false;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async forceRestorePresentationOnNewEvents(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Viewer1', moderatorPW: '' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-page1-${testName}`);
    await this.page2.closeAudioModal();
    await this.page2.screenshot(`${testName}`, `02-page2-${testName}`);
    await this.page1.waitForSelector(cpe.container);
    await this.page2.waitForSelector(cpe.hidePresentation);
    await this.page2.click(cpe.hidePresentation, true);
    await this.page2.screenshot(`${testName}`, `03-page2-${testName}`);
    const zoomInCase = await util.zoomIn(this.page1);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const zoomOutCase = await util.zoomOut(this.page1);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const pollCase = await util.poll(this.page1);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const previousSlideCase = await util.previousSlide(this.page1);
    await this.page1.screenshot(`${testName}`, `04-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `05-page2-${testName}`);
    const nextSlideCase = await util.nextSlide(this.page1);
    await this.page1.screenshot(`${testName}`, `05-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `06-page2-${testName}`);
    const annotationCase = await util.annotation(this.page1);
    await this.page1.screenshot(`${testName}`, `06-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `07-page2-${testName}`);
    if (zoomInCase === true && zoomOutCase === true && pollCase === true && previousSlideCase === true && nextSlideCase === true && annotationCase === true
       && await this.page2.page.evaluate(util.countTestElements, cpe.restorePresentation) === true) {
      await this.page2.screenshot(`${testName}`, `08-page2-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page2.page.evaluate(util.countTestElements, cpe.restorePresentation) === false;
    await this.page2.screenshot(`${testName}`, `08-page2-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return true;
  }

  async recordMeeting(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    if (await this.page1.page.evaluate(util.getTestElement, cpe.recordingIndicator) === false) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.recordingIndicator) === true;
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async skipVideoPreview(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.shareWebcamButton);
    await this.page1.click(cpe.shareWebcamButton, true);
    if (await this.page1.page.evaluate(util.getTestElement, cpe.webcamSettingsModal) === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.webcamSettingsModal) === true;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async mirrorOwnWebcam(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.shareWebcamButton);
    await this.page1.click(cpe.shareWebcamButton, true);
    await this.page1.waitForSelector(cpe.webcamMirroredVideoPreview);
    await this.page1.waitForSelector(cpe.startSharingWebcamButton);
    await this.page1.click(cpe.startSharingWebcamButton, true);
    if (await this.page1.page.evaluate(util.getTestElement, cpe.webcamMirroredVideoContainer) === true) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.webcamMirroredVideoContainer) === false;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async showParticipantsOnLogin(testName, args, meetingId, customParameter) {
    this.page1.logger('before init ', testName);
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    this.page1.logger('after init ', testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.whiteboard);
    if (await this.page1.page.evaluate(util.getTestElement, cpe.userslistContainer) === false) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    const resp = await this.page1.page.evaluate(util.getTestElement, cpe.userslistContainer) === true;
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async closePage(page) {
    page.close();
  }

  async close(page1, page2) {
    page1.close();
    page2.close();
  }
}

module.exports = exports = CustomParameters;
