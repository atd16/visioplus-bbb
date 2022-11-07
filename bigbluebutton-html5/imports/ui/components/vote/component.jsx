import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import PresentationUploaderContainer from '/imports/ui/components/presentation/presentation-uploader/container';
import { withModalMounter } from '/imports/ui/components/modal/service';
import _ from 'lodash';
import { Session } from 'meteor/session';
import Button from '/imports/ui/components/button/component';
import LiveResult from './live-result/component';
import { styles } from './styles.scss';
import Auth from '/imports/ui/services/auth';
import Service from './service';

const intlMessages = defineMessages({
  votePaneTitle: {
    id: 'app.vote.votePaneTitle',
    description: 'heading label for the vote menu',
  },
  closeLabel: {
    id: 'app.vote.closeLabel',
    description: 'label for vote pane close button',
  },
  voteDescriptionLabel: {
    id: 'app.vote.descriptionLabel',
    description: 'vote description label',
  },
  voteDescriptionPlaceholder: {
    id: 'app.vote.descriptionPlaceholder',
    description: 'vote description placeholder',
  },
  votePrivacyLabel: {
    id: 'app.vote.privacyLabel',
    description: 'vote privacy label',
  },
  hideVoteDesc: {
    id: 'app.vote.hideVoteDesc',
    description: 'aria label description for hide vote button',
  },
  startVote: {
    id: 'app.vote.startVote',
    description: 'start vote button label',
  },
  activeVoteInstruction: {
    id: 'app.vote.activeVoteInstruction',
    description: 'instructions displayed when a vote is active',
  },
});

const MAX_INPUT_CHARS = 45;

class Vote extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isVoting: false,
      desc: '',
      priv: false,
    };

    this.handleBackClick = this.handleBackClick.bind(this);
    this.startVote = this.startVote.bind(this);
  }

  componentDidMount() {
    const { props } = this.hideBtn;
    const { className } = props;

    const hideBtn = document.getElementsByClassName(`${className}`);
    if (hideBtn[0]) hideBtn[0].focus();
  }

  componentDidUpdate() {
    const { amIPresenter } = this.props;

    if (Session.equals('resetVotePanel', true)) {
      this.handleBackClick();
    }

    if (!amIPresenter) {
      Session.set('openPanel', 'userlist');
      Session.set('forceVoteOpen', false);
    }
  }

  handleBackClick() {
    const { vote, stopVote } = this.props;

    Session.set('resetVotePanel', false);

    if(vote){
      stopVote(vote.voteId);
    }
    this.inputEditor = [];
    this.setState({
      isVoting: false,
    }, document.activeElement.blur());
  }

  handleInputChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handlePrivateInputChange(e) {
    if (e.target.value) {
      this.setState({ [e.target.name]: true });
    } else {
      this.setState({ [e.target.name]: false });
    }
  }

  renderActiveVoteOptions() {
    const {
      intl,
      voteAnswerIds,
      vote,
      adminInfos,
      isGreenlightConnected,
      publishVote,
    } = this.props;

    return (
      <div>
        <div className={styles.instructions}>
          {intl.formatMessage(intlMessages.activeVoteInstruction)}
        </div>
        <LiveResult
          {...{
            vote,
            voteAnswerIds,
            adminInfos,
            isGreenlightConnected,
            publishVote,
          }}
          handleBackClick={this.handleBackClick}
        />
      </div>
    );
  }

  startVote() {
    const { makeGreenlightCall } = this.props;

    makeGreenlightCall('start_vote', {description: this.state.description, anonymous: this.state.anonymous})
  }

  renderVoteOptions() {
    const { intl, isGreenlightConnected } = this.props;

    return (
      <div>
        <input
          aria-label={intl.formatMessage(intlMessages.voteDescriptionLabel)}
          placeholder={intl.formatMessage(intlMessages.voteDescriptionPlaceholder)}
          className={styles.input}
          name="description"
          maxLength={MAX_INPUT_CHARS}
          onChange={e => this.handleInputChange(e)}
        />
        <span name="privLabel" className={styles.privacyLabel}>{intl.formatMessage(intlMessages.votePrivacyLabel)}</span>
        <label className={styles.sw}>
          <input
            name="anonymous"
            type="checkbox"
            onChange={e => this.handlePrivateInputChange(e)}
          />
          <span className={styles.slider} />
        </label>
        <Button
          disabled={!isGreenlightConnected}
          label={intl.formatMessage(intlMessages.startVote)}
          color="primary"
          className={styles.startBtn}
          key={_.uniqueId('quick-vote-')}
          onClick={() => {
            Session.set('voteInitiated', true);
            this.setState({ isVoting: true }, () => this.startVote());
          }}
        />
      </div>
    );
  }

  renderVotePanel() {
    const { isVoting } = this.state;
    const {
      vote,
    } = this.props;


    if (isVoting || (!isVoting && vote)) {
      return this.renderActiveVoteOptions();
    }

    return this.renderVoteOptions();
  }

  render() {
    const {
      intl,
      amIPresenter,
      vote
    } = this.props;

    if (!amIPresenter) return null;

    return (
      <div>
        <header className={styles.header}>
          <Button
            ref={(node) => { this.hideBtn = node; }}
            tabIndex={0}
            label={intl.formatMessage(intlMessages.votePaneTitle)}
            icon="left_arrow"
            aria-label={intl.formatMessage(intlMessages.hideVoteDesc)}
            className={styles.hideBtn}
            onClick={() => {
              Session.set('openPanel', 'userlist');
            }}
          />

          <Button
            label={intl.formatMessage(intlMessages.closeLabel)}
            aria-label={`${intl.formatMessage(intlMessages.closeLabel)} ${intl.formatMessage(intlMessages.votePaneTitle)}`}
            onClick={() => {
              if (vote) {
                stopVote();
              }
              Session.set('openPanel', 'userlist');
              Session.set('forceVoteOpen', false);
            }}
            className={styles.closeBtn}
            icon="close"
            size="sm"
            hideLabel
          />

        </header>
        {
          this.renderVotePanel()
        }
      </div>
    );
  }
}

export default withModalMounter(injectIntl(Vote));

Vote.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  amIPresenter: PropTypes.bool.isRequired,
};
