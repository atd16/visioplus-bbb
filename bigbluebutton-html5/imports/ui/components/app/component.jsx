import React, { Component } from 'react';
import $ from 'jquery';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import Modal from 'react-modal';
import browser from 'browser-detect';
import PanelManager from '/imports/ui/components/panel-manager/component';
import PollingContainer from '/imports/ui/components/polling/container';
import VotingContainer from '/imports/ui/components/voting/container';
import PublishVotingContainer from '/imports/ui/components/publish-voting/container';
import logger from '/imports/startup/client/logger';
import ActivityCheckContainer from '/imports/ui/components/activity-check/container';
import UserInfoContainer from '/imports/ui/components/user-info/container';
import BreakoutRoomInvitation from '/imports/ui/components/breakout-room/invitation/container';
import ToastContainer from '../toast/container';
import ModalContainer from '../modal/container';
import NotificationsBarContainer from '../notifications-bar/container';
import AudioContainer from '../audio/container';
import ChatAlertContainer from '../chat/alert/container';
import BannerBarContainer from '/imports/ui/components/banner-bar/container';
import WaitingNotifierContainer from '/imports/ui/components/waiting-users/alert/container';
import LockNotifier from '/imports/ui/components/lock-viewers/notify/container';
import StatusNotifier from '/imports/ui/components/status-notifier/container';
import MediaService from '/imports/ui/components/media/service';
import ManyWebcamsNotifier from '/imports/ui/components/video-provider/many-users-notify/container';
import UploaderContainer from '/imports/ui/components/presentation/presentation-uploader/container';
import RandomUserSelectContainer from '/imports/ui/components/modal/random-user/container';
import { withDraggableContext } from '../media/webcam-draggable-overlay/context';
import { styles } from './styles';
import Auth from '/imports/ui/services/auth';
import Users from '/imports/api/users';
import { makeCall } from '/imports/ui/services/api';
import { NAVBAR_HEIGHT } from '/imports/ui/components/layout/layout-manager';

const MOBILE_MEDIA = 'only screen and (max-width: 40em)';
const APP_CONFIG = Meteor.settings.public.app;
const DESKTOP_FONT_SIZE = APP_CONFIG.desktopFontSize;
const MOBILE_FONT_SIZE = APP_CONFIG.mobileFontSize;
const ENABLE_NETWORK_MONITORING = Meteor.settings.public.networkMonitoring.enableNetworkMonitoring;

const getHostname = (url) => {
  return new URL(url).hostname;
}

const intlMessages = defineMessages({
  userListLabel: {
    id: 'app.userList.label',
    description: 'Aria-label for Userlist Nav',
  },
  chatLabel: {
    id: 'app.chat.label',
    description: 'Aria-label for Chat Section',
  },
  mediaLabel: {
    id: 'app.media.label',
    description: 'Aria-label for Media Section',
  },
  actionsBarLabel: {
    id: 'app.actionsBar.label',
    description: 'Aria-label for ActionsBar Section',
  },
  iOSWarning: {
    id: 'app.iOSWarning.label',
    description: 'message indicating to upgrade ios version',
  },
  clearedEmoji: {
    id: 'app.toast.clearedEmoji.label',
    description: 'message for cleared emoji status',
  },
  setEmoji: {
    id: 'app.toast.setEmoji.label',
    description: 'message when a user emoji has been set',
  },
  meetingMuteOn: {
    id: 'app.toast.meetingMuteOn.label',
    description: 'message used when meeting has been muted',
  },
  meetingMuteOff: {
    id: 'app.toast.meetingMuteOff.label',
    description: 'message used when meeting has been unmuted',
  },
  pollPublishedLabel: {
    id: 'app.whiteboard.annotations.poll',
    description: 'message displayed when a poll is published',
  },
});

const propTypes = {
  navbar: PropTypes.element,
  sidebar: PropTypes.element,
  media: PropTypes.element,
  actionsbar: PropTypes.element,
  captions: PropTypes.element,
  locale: PropTypes.string,
  intl: PropTypes.object.isRequired,
};

const defaultProps = {
  navbar: null,
  sidebar: null,
  media: null,
  actionsbar: null,
  captions: null,
  locale: 'en',
};

const LAYERED_BREAKPOINT = 640;
const isLayeredView = window.matchMedia(`(max-width: ${LAYERED_BREAKPOINT}px)`);

class App extends Component {
  constructor() {
    super();
    this.state = {
      enableResize: !window.matchMedia(MOBILE_MEDIA).matches,
    };

    this.handleWindowResize = throttle(this.handleWindowResize).bind(this);
    this.shouldAriaHide = this.shouldAriaHide.bind(this);
    this.openGreenlightSocket = this.openGreenlightSocket.bind(this);
    this.handleGreenlightMessage = this.handleGreenlightMessage.bind(this);
    this.makeGreenlightCall = this.makeGreenlightCall.bind(this);
    this.handleVote = this.handleVote.bind(this);
    this.getAdminInfos = this.getAdminInfos.bind(this);
    this.stopVote = this.stopVote.bind(this);
    this.publishVote = this.publishVote.bind(this);
    this.closePublishVoting = this.closePublishVoting.bind(this);
    this.renderMedia = withDraggableContext(this.renderMedia.bind(this));
  }

  componentDidMount() {
    const {
      locale, notify, intl, validIOSVersion, startBandwidthMonitoring, handleNetworkConnection,
    } = this.props;
    const BROWSER_RESULTS = browser();
    const isMobileBrowser = BROWSER_RESULTS.mobile || BROWSER_RESULTS.os.includes('Android');

    MediaService.setSwapLayout();
    Modal.setAppElement('#app');
    document.getElementsByTagName('html')[0].lang = locale;
    document.getElementsByTagName('html')[0].style.fontSize = isMobileBrowser ? MOBILE_FONT_SIZE : DESKTOP_FONT_SIZE;

    const body = document.getElementsByTagName('body')[0];
    if (BROWSER_RESULTS && BROWSER_RESULTS.name) {
      body.classList.add(`browser-${BROWSER_RESULTS.name}`);
    }
    if (BROWSER_RESULTS && BROWSER_RESULTS.os) {
      body.classList.add(`os-${BROWSER_RESULTS.os.split(' ').shift().toLowerCase()}`);
    }

    if (!validIOSVersion()) {
      notify(
        intl.formatMessage(intlMessages.iOSWarning), 'error', 'warning',
      );
    }

    this.handleWindowResize();
    window.addEventListener('resize', this.handleWindowResize, false);
    window.ondragover = function (e) { e.preventDefault(); };
    window.ondrop = function (e) { e.preventDefault(); };

    if (ENABLE_NETWORK_MONITORING) {
      if (navigator.connection) {
        handleNetworkConnection();
        navigator.connection.addEventListener('change', handleNetworkConnection);
      }

      startBandwidthMonitoring();
    }

    this.openGreenlightSocket();
    if (isMobileBrowser) makeCall('setMobileUser');

    logger.info({ logCode: 'app_component_componentdidmount' }, 'Client loaded successfully');
  }

  componentDidUpdate(prevProps) {
    const {
      meetingMuted,
      notify,
      currentUserEmoji,
      intl,
      hasPublishedPoll,
      randomlySelectedUser,
      currentUserId,
      mountModal,
    } = this.props;

    if (randomlySelectedUser === currentUserId) mountModal(<RandomUserSelectContainer />);

    if (prevProps.currentUserEmoji.status !== currentUserEmoji.status) {
      const formattedEmojiStatus = intl.formatMessage({ id: `app.actionsBar.emojiMenu.${currentUserEmoji.status}Label` })
      || currentUserEmoji.status;

      notify(
        currentUserEmoji.status === 'none'
          ? intl.formatMessage(intlMessages.clearedEmoji)
          : intl.formatMessage(intlMessages.setEmoji, ({ 0: formattedEmojiStatus })),
        'info',
        currentUserEmoji.status === 'none'
          ? 'clear_status'
          : 'user',
      );
    }
    if (!prevProps.meetingMuted && meetingMuted) {
      notify(
        intl.formatMessage(intlMessages.meetingMuteOn), 'info', 'mute',
      );
    }
    if (prevProps.meetingMuted && !meetingMuted) {
      notify(
        intl.formatMessage(intlMessages.meetingMuteOff), 'info', 'unmute',
      );
    }
    if (!prevProps.hasPublishedPoll && hasPublishedPoll) {
      notify(
        intl.formatMessage(intlMessages.pollPublishedLabel), 'info', 'polling',
      );
    }
  }

  componentWillUnmount() {
    const { handleNetworkConnection } = this.props;
    window.removeEventListener('resize', this.handleWindowResize, false);
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleNetworkConnection, false);
    }
  }

  handleWindowResize() {
    const { enableResize } = this.state;
    const shouldEnableResize = !window.matchMedia(MOBILE_MEDIA).matches;
    if (enableResize === shouldEnableResize) return;

    this.setState({ enableResize: shouldEnableResize });
  }

  getAdminInfos() {
    const GL_URL = "https://"+getHostname(Auth.logoutURL)+"/b";
    if (this.state.vote) {
      $.ajax({
        url: GL_URL+`/${this.state.vote.voteId}/admin_infos`,
        type: 'GET',
        dataType: 'json',
	xhrFields: {
       	  withCredentials: true
    	},
        success: function (infos) {
          this.setState({ adminInfos: infos });
        }.bind(this),
      });
    }
  }

  handleGreenlightMessage(event) {
    const msg = JSON.parse(event.data);
    const amIPresenter = Users.findOne({ userId: Auth.userID }, { fields: { presenter: 1 } }).presenter;
    const GL_URL = "https://"+getHostname(Auth.logoutURL)+"/b";

    if (msg.type === 'ping' || msg.type === 'confirm_subscription' || msg.type === 'welcome') {
      return;
    }

    switch (msg.message.action) {
      case 'vote_started':
        const vote = {};
        vote.voteId = msg.message.vote_id;
	      vote.anonymous = msg.message.anonymous;
	      vote.description = msg.message.description;
        $.ajax({
          url: GL_URL+`/${Auth.externMeetingID}/vote_infos`,
          type: 'GET',
          data: `user_uid=${Auth.externUserID}`,
          dataType: 'json',
	  xhrFields: {
            withCredentials: true
          },
          success: function (infos) {
            const voteInfos = infos;
            for (const info in voteInfos) {
              const infoObj = voteInfos[info];
              infoObj.voted = false;
            }
            this.setState({ vote, voteInfos, votePublished: null });
            if (amIPresenter) {
              this.getAdminInfos();
            }
          }.bind(this),
        });
      case 'vote_closed':
        if (msg.message.is_published) {
          const votePublished = this.state.vote;
          votePublished.infos = msg.message.infos;
          this.setState({
            vote: null, voteInfos: null, adminInfos: null, isPublishVotingClosed: false, votePublished,
          });
        }
    }

    if (amIPresenter) {
      this.getAdminInfos();
    }
  }

  openGreenlightSocket() {
    const WEBSOCKET_URL = "wss://"+getHostname(Auth.logoutURL)+"/b/cable";
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = function (event) {
      const msg = {
  	     command: 'subscribe',
        identifier: JSON.stringify({
          channel: 'VoteChannel',
          useruid: Auth.externUserID,
          meetingid: Auth.externMeetingID,
        }),
      };
      socket.send(JSON.stringify(msg));
      this.setState({ isGreenlightConnected: true });
    }.bind(this);

    socket.onmessage = function (event) {
      this.handleGreenlightMessage(event);
    }.bind(this);

    socket.onclose = function (event) {
      this.setState({ isGreenlightConnected: false });
    }.bind(this);
    this.setState({ socket });
  }

  makeGreenlightCall(name, args) {
    check(name, String);

    const msg = {
      command: 'message',
      identifier: JSON.stringify({
        channel: 'VoteChannel',
        useruid: Auth.externUserID,
        meetingid: Auth.externMeetingID,
      }),
      data: JSON.stringify({
        action: name,
        ...args,
      }),
    };

    if (this.state.socket) this.state.socket.send(JSON.stringify(msg));
    else logger.error('Error Greenlight socket connection');
  }

  handleVote(infoId, voteId, answer) {
    const voteInfos = this.state.voteInfos;
    for (const info in voteInfos) {
      const infoObj = voteInfos[info];
      if (infoObj.id == infoId) {
        infoObj.voted = true;
        if (!infoObj.proxy_uid) this.makeGreenlightCall('register_vote_result', { vote_id: voteId, value: answer });
        else this.makeGreenlightCall('register_proxy_vote_result', { vote_id: voteId, useruid: infoObj.voting_uid, value: answer });
      }
    }
    this.setState({ voteInfos });
  }

  stopVote(voteId, isPublished = false) {
    this.makeGreenlightCall('close_vote', { id: voteId, is_published: isPublished });
  }

  publishVote(voteId) {
    this.stopVote(voteId, true);
    const amIPresenter = Users.findOne({ userId: Auth.userID }, { fields: { presenter: 1 } }).presenter;
    if (amIPresenter) {
      Session.set('openPanel', 'userlist');
    }
  }

  closePublishVoting() {
    this.setState({ isPublishVotingClosed: true });
  }

  shouldAriaHide() {
    const { openPanel, isPhone } = this.props;
    return openPanel !== '' && (isPhone || isLayeredView.matches);
  }

  renderPanel() {
    const {
      enableResize, vote, voteInfos, isGreenlightConnected, adminInfos,
    } = this.state;
    const { openPanel, isRTL } = this.props;

    return (
      <PanelManager
        {...{
          openPanel,
          enableResize,
          vote,
          adminInfos,
          isGreenlightConnected,
          isRTL,
        }}
        shouldAriaHide={this.shouldAriaHide}
        makeGreenlightCall={this.makeGreenlightCall}
        stopVote={this.stopVote}
        publishVote={this.publishVote}
      />
    );
  }

  renderNavBar() {
    const { navbar } = this.props;

    if (!navbar) return null;

    return (
      <header
        className={styles.navbar}
        style={{
          height: NAVBAR_HEIGHT,
        }}
      >
        {navbar}
      </header>
    );
  }

  renderSidebar() {
    const { sidebar } = this.props;

    if (!sidebar) return null;

    return (
      <aside className={styles.sidebar}>
        {sidebar}
      </aside>
    );
  }

  renderCaptions() {
    const { captions } = this.props;

    if (!captions) return null;

    return (
      <div className={styles.captionsWrapper}>
        {captions}
      </div>
    );
  }

  renderMedia() {
    const {
      media,
      intl,
    } = this.props;

    if (!media) return null;

    return (
      <section
        className={styles.media}
        aria-label={intl.formatMessage(intlMessages.mediaLabel)}
        aria-hidden={this.shouldAriaHide()}
      >
        {media}
        {this.renderCaptions()}
      </section>
    );
  }

  renderActionsBar() {
    const {
      actionsbar,
      intl,
    } = this.props;

    if (!actionsbar) return null;

    return (
      <section
        className={styles.actionsbar}
        aria-label={intl.formatMessage(intlMessages.actionsBarLabel)}
        aria-hidden={this.shouldAriaHide()}
      >
        {actionsbar}
      </section>
    );
  }

  renderActivityCheck() {
    const { User } = this.props;

    const { inactivityCheck, responseDelay } = User;

    return (inactivityCheck ? (
      <ActivityCheckContainer
        inactivityCheck={inactivityCheck}
        responseDelay={responseDelay}
      />) : null);
  }

  renderUserInformation() {
    const { UserInfo, User } = this.props;

    return (UserInfo.length > 0 ? (
      <UserInfoContainer
        UserInfo={UserInfo}
        requesterUserId={User.userId}
        meetingId={User.meetingId}
      />) : null);
  }

  render() {
    const {
      customStyle, customStyleUrl, openPanel,
    } = this.props;
    return (
      <main className={styles.main}>
        {this.renderActivityCheck()}
        {this.renderUserInformation()}
        <BannerBarContainer />
        <NotificationsBarContainer />
        <section className={styles.wrapper}>
          <div className={openPanel ? styles.content : styles.noPanelContent}>
            {this.renderNavBar()}
            {this.renderMedia()}
            {this.renderActionsBar()}
          </div>
          {this.renderPanel()}
          {this.renderSidebar()}
        </section>
        <UploaderContainer />
        <BreakoutRoomInvitation />
        <PollingContainer />
        <VotingContainer vote={this.state.vote} voteInfos={this.state.voteInfos} isGreenlightConnected={this.state.isGreenlightConnected} handleVote={this.handleVote} />
        <PublishVotingContainer votePublished={this.state.votePublished} closePublishVoting={this.closePublishVoting} isPublishVotingClosed={this.state.isPublishVotingClosed} />
        <ModalContainer />
        <AudioContainer />
        <ToastContainer rtl />
        <ChatAlertContainer />
        <WaitingNotifierContainer />
        <LockNotifier />
        <StatusNotifier status="raiseHand" />
        <ManyWebcamsNotifier />
        {customStyleUrl ? <link rel="stylesheet" type="text/css" href={customStyleUrl} /> : null}
        {customStyle ? <link rel="stylesheet" type="text/css" href={`data:text/css;charset=UTF-8,${encodeURIComponent(customStyle)}`} /> : null}
      </main>
    );
  }
}

App.propTypes = propTypes;
App.defaultProps = defaultProps;

export default injectIntl(App);
