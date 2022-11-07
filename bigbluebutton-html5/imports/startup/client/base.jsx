import React, { Component, Fragment } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import Auth from '/imports/ui/services/auth';
import AppContainer from '/imports/ui/components/app/container';
import ErrorScreen from '/imports/ui/components/error-screen/component';
import MeetingEnded from '/imports/ui/components/meeting-ended/component';
import LoadingScreen from '/imports/ui/components/loading-screen/component';
import Settings from '/imports/ui/services/settings';
import logger from '/imports/startup/client/logger';
import Users from '/imports/api/users';
import { Session } from 'meteor/session';
import { FormattedMessage } from 'react-intl';
import Meetings, { RecordMeetings } from '../../api/meetings';
import AppService from '/imports/ui/components/app/service';
import Breakouts from '/imports/api/breakouts';
import AudioService from '/imports/ui/components/audio/service';
import { notify } from '/imports/ui/services/notification';
import deviceInfo from '/imports/utils/deviceInfo';
import getFromUserSettings from '/imports/ui/services/users-settings';
import LayoutManager from '/imports/ui/components/layout/layout-manager';
import { withLayoutContext } from '/imports/ui/components/layout/context';
import VideoService from '/imports/ui/components/video-provider/service';
import DebugWindow from '/imports/ui/components/debug-window/component'
import {Meteor} from "meteor/meteor";

const CHAT_CONFIG = Meteor.settings.public.chat;
const CHAT_ENABLED = CHAT_CONFIG.enabled;
const PUBLIC_CHAT_ID = CHAT_CONFIG.public_id;

const BREAKOUT_END_NOTIFY_DELAY = 50;

const HTML = document.getElementsByTagName('html')[0];

let breakoutNotified = false;

const propTypes = {
  subscriptionsReady: PropTypes.bool,
  approved: PropTypes.bool,
  meetingHasEnded: PropTypes.bool.isRequired,
  meetingExist: PropTypes.bool,
};

const defaultProps = {
  approved: false,
  meetingExist: false,
  subscriptionsReady: false,
};

const fullscreenChangedEvents = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
];

class Base extends Component {
  static handleFullscreenChange() {
    if (document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement) {
      Session.set('isFullscreen', true);
    } else {
      Session.set('isFullscreen', false);
    }
  }

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      meetingExisted: false,
    };
    this.updateLoadingState = this.updateLoadingState.bind(this);
  }

  componentDidMount() {
    const { animations } = this.props;

    if (animations) HTML.classList.add('animationsEnabled');
    if (!animations) HTML.classList.add('animationsDisabled');

    if (getFromUserSettings('bbb_show_participants_on_login', true) && !deviceInfo.type().isPhone) {
      Session.set('openPanel', 'userlist');
      if (CHAT_ENABLED) {
        Session.set('openPanel', 'chat');
        Session.set('idChatOpen', PUBLIC_CHAT_ID);
      }
    } else {
      Session.set('openPanel', '');
    }

    fullscreenChangedEvents.forEach((event) => {
      document.addEventListener(event, Base.handleFullscreenChange);
    });
    Session.set('isFullscreen', false);
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      approved,
      meetingExist,
      animations,
      ejected,
      isMeteorConnected,
      subscriptionsReady,
      layoutContextDispatch,
      usersVideo,
    } = this.props;
    const {
      loading,
      meetingExisted,
    } = this.state;

    if (usersVideo !== prevProps.usersVideo) {
      layoutContextDispatch(
        {
          type: 'setUsersVideo',
          value: usersVideo.length,
        },
      );
    }

    if (!prevProps.subscriptionsReady && subscriptionsReady) {
      logger.info({ logCode: 'startup_client_subscriptions_ready' }, 'Subscriptions are ready');
    }

    if (prevProps.meetingExist && !meetingExist && !meetingExisted) {
      this.setMeetingExisted(true);
    }

    // In case the meteor restart avoid error log
    if (isMeteorConnected && (prevState.meetingExisted !== meetingExisted) && meetingExisted) {
      this.setMeetingExisted(false);
    }

    // In case the meeting delayed to load
    if (!subscriptionsReady || !meetingExist) return;

    if (approved && loading && subscriptionsReady) this.updateLoadingState(false);

    if (prevProps.ejected || ejected) {
      Session.set('codeError', '403');
      Session.set('isMeetingEnded', true);
    }

    // In case the meteor restart avoid error log
    if (isMeteorConnected && (prevState.meetingExisted !== meetingExisted)) {
      this.setMeetingExisted(false);
    }

    const enabled = HTML.classList.contains('animationsEnabled');
    const disabled = HTML.classList.contains('animationsDisabled');

    if (animations && animations !== prevProps.animations) {
      if (disabled) HTML.classList.remove('animationsDisabled');
      HTML.classList.add('animationsEnabled');
    } else if (!animations && animations !== prevProps.animations) {
      if (enabled) HTML.classList.remove('animationsEnabled');
      HTML.classList.add('animationsDisabled');
    }
  }

  componentWillUnmount() {
    fullscreenChangedEvents.forEach((event) => {
      document.removeEventListener(event, Base.handleFullscreenChange);
    });
  }

  setMeetingExisted(meetingExisted) {
    this.setState({ meetingExisted });
  }

  updateLoadingState(loading = false) {
    this.setState({
      loading,
    });
  }

  renderByState() {
    const { updateLoadingState } = this;
    const stateControls = { updateLoadingState };
    const { loading } = this.state;
    const {
      codeError,
      ejected,
      ejectedReason,
      meetingExist,
      meetingHasEnded,
      meetingIsBreakout,
      subscriptionsReady,
      User,
    } = this.props;

    if ((loading || !subscriptionsReady) && !meetingHasEnded && meetingExist) {
      return (<LoadingScreen>{loading}</LoadingScreen>);
    }

    if (ejected) {
      return (<MeetingEnded code="403" reason={ejectedReason} />);
    }

    if ((meetingHasEnded || User?.loggedOut) && meetingIsBreakout) {
      window.close();
      return null;
    }

    if (((meetingHasEnded && !meetingIsBreakout)) || (codeError && User?.loggedOut)) {
      return (<MeetingEnded code={codeError} />);
    }

    if (codeError && !meetingHasEnded) {
      // 680 is set for the codeError when the user requests a logout
      if (codeError !== '680') {
        return (<ErrorScreen code={codeError} />);
      }
      return (<MeetingEnded code={codeError} />);
    }

    return (<AppContainer {...this.props} baseControls={stateControls} />);
  }

  render() {
    const {
      meetingExist,
    } = this.props;
    const { meetingExisted } = this.state;

    return (
      <Fragment>
        {meetingExist && Auth.loggedIn && <DebugWindow />}
        {meetingExist && Auth.loggedIn && <LayoutManager />}
        {
          (!meetingExisted && !meetingExist && Auth.loggedIn)
            ? <LoadingScreen />
            : this.renderByState()
        }
      </Fragment>
    );
  }
}

Base.propTypes = propTypes;
Base.defaultProps = defaultProps;

const BaseContainer = withTracker(() => {
  const {
    animations,
    userJoinAudioAlerts,
    userJoinPushAlerts,
  } = Settings.application;

  const {
    credentials,
    loggedIn,
    userID: localUserId,
  } = Auth;

  const { meetingId } = credentials;
  let breakoutRoomSubscriptionHandler;
  let meetingModeratorSubscriptionHandler;

  const fields = {
    approved: 1,
    authed: 1,
    ejected: 1,
    ejectedReason: 1,
    color: 1,
    mobile: 1,
    effectiveConnectionType: 1,
    extId: 1,
    guest: 1,
    intId: 1,
    locked: 1,
    loggedOut: 1,
    meetingId: 1,
    userId: 1,
    inactivityCheck: 1,
    responseDelay: 1,
  };
  const User = Users.findOne({ intId: credentials.requesterUserId }, { fields });
  const meeting = Meetings.findOne({ meetingId }, {
    fields: {
      meetingEnded: 1,
      meetingProp: 1,
    },
  });

  if (meeting && meeting.meetingEnded) {
    Session.set('codeError', '410');
  }

  const approved = User?.approved && User?.guest;
  const ejected = User?.ejected;
  const ejectedReason = User?.ejectedReason;

  let userSubscriptionHandler;

  Breakouts.find({}, { fields: { _id: 1 } }).observeChanges({
    added() {
      breakoutNotified = false;
    },
    removed() {
      // Need to check the number of breakouts left because if a user's role changes to viewer
      // then all but one room is removed. The data here isn't reactive so no need to filter
      // the fields
      const numBreakouts = Breakouts.find().count();
      if (!AudioService.isUsingAudio() && !breakoutNotified && numBreakouts === 0) {
        if (meeting && !meeting.meetingEnded && !meeting.meetingProp.isBreakout) {
          // There's a race condition when reloading a tab where the collection gets cleared
          // out and then refilled. The removal of the old data triggers the notification so
          // instead wait a bit and check to see that records weren't added right after.
          setTimeout(() => {
            if (breakoutNotified) {
              notify(
                <FormattedMessage
                  id="app.toast.breakoutRoomEnded"
                  description="message when the breakout room is ended"
                />,
                'info',
                'rooms',
              );
            }
          }, BREAKOUT_END_NOTIFY_DELAY);
        }
        breakoutNotified = true;
      }
    },
  });

  RecordMeetings.find({ meetingId }, { fields: { recording: 1 } }).observe({
    changed: (newDocument, oldDocument) => {
      if (newDocument) {
        if (!oldDocument.recording && newDocument.recording) {
          notify(
            <FormattedMessage
              id="app.notification.recordingStart"
              description="Notification for when the recording starts"
            />,
            'success',
            'record',
          );
        }

        if (oldDocument.recording && !newDocument.recording) {
          notify(
            <FormattedMessage
              id="app.notification.recordingPaused"
              description="Notification for when the recording stops"
            />,
            'error',
            'record',
          );
        }
      }
    },
  });

  if (userJoinAudioAlerts || userJoinPushAlerts) {
    Users.find({}, { fields: { validated: 1, name: 1, userId: 1 } }).observe({
      changed: (newDocument) => {
        if (newDocument.validated && newDocument.name && newDocument.userId !== localUserId) {
          if (userJoinAudioAlerts) {
            AudioService.playAlertSound(`${Meteor.settings.public.app.cdn
              + Meteor.settings.public.app.basename
              + Meteor.settings.public.app.instanceId}`
              + '/resources/sounds/userJoin.mp3');
          }

          if (userJoinPushAlerts) {
            notify(
              <FormattedMessage
                id="app.notification.userJoinPushAlert"
                description="Notification for a user joins the meeting"
                values={{
                  0: newDocument.name,
                }}
              />,
              'info',
              'user',
            );
          }
        }
      },
    });
  }

  if (getFromUserSettings('bbb_show_participants_on_login', true) && !deviceInfo.type().isPhone) {
    if (CHAT_ENABLED && getFromUserSettings('bbb_show_public_chat_on_login', !Meteor.settings.public.chat.startClosed)) {
      Session.setDefault('openPanel', 'chat');
      Session.setDefault('idChatOpen', PUBLIC_CHAT_ID);
    } else {
      Session.setDefault('openPanel', 'userlist');
    }
  } else {
    Session.setDefault('openPanel', '');
  }

  const codeError = Session.get('codeError');
  const usersVideo = VideoService.getVideoStreams();

  return {
    approved,
    ejected,
    ejectedReason,
    userSubscriptionHandler,
    breakoutRoomSubscriptionHandler,
    meetingModeratorSubscriptionHandler,
    animations,
    User,
    isMeteorConnected: Meteor.status().connected,
    meetingExist: !!meeting,
    meetingHasEnded: !!meeting && meeting.meetingEnded,
    meetingIsBreakout: AppService.meetingIsBreakout(),
    subscriptionsReady: Session.get('subscriptionsReady'),
    loggedIn,
    codeError,
    usersVideo,
  };
})(withLayoutContext(Base));

export default BaseContainer;
