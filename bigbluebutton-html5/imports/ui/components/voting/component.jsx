import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
import { styles } from './styles.scss';
import AudioService from '/imports/ui/components/audio/service';
import VoteService from '/imports/ui/components/vote/service';

const intlMessages = defineMessages({
  pollingTitleLabel: {
    id: 'app.polling.pollingTitle',
  },
  pollAnswerLabel: {
    id: 'app.polling.pollAnswerLabel',
  },
  pollAnswerDesc: {
    id: 'app.polling.pollAnswerDesc',
  },
  voteProxyLabel: {
    id: 'app.vote.voteProxyLabel',
  },
});

class Voting extends Component {
  constructor(props) {
    super(props);

    this.play = this.play.bind(this);
  }

  componentDidMount() {
    this.play();
  }

  play() {
    AudioService.playAlertSound(`${Meteor.settings.public.app.cdn
      + Meteor.settings.public.app.basename
      + Meteor.settings.public.app.instanceId}`
      + '/resources/sounds/Poll.mp3');
  }

  render() {
    const {
      intl,
      vote,
      info,
      isGreenlightConnected,
      handleVote,
    } = this.props;
    const voteAnswerIds = VoteService.voteAnswerIds
    const answers = ["yes", "no", "abs"];
    const stackOptions = false;
    const pollAnswerStyles = {
      [styles.pollingAnswers]: true,
      [styles.removeColumns]: answers.length === 1,
      [styles.stacked]: stackOptions,
    };

    let proxy = ""
    if(info.proxy_uid)
      proxy = " - "+intl.formatMessage(intlMessages.voteProxyLabel)

    return (
      <div className={styles.overlay}>
        <div
          className={cx({
            [styles.pollingContainer]: true,
            [styles.autoWidth]: stackOptions,
          })}
          role="alert"
        >
          <div className={styles.pollingTitle}>
            {vote.description}
          </div>
          <div className={styles.votingSubTitle}>
            {info.voting_name}
            <span className={styles.proxyLabel}>
              {proxy}
            </span>
          </div>
          <div className={cx(pollAnswerStyles)}>
            {answers.map((answer) => {
              const formattedMessageIndex = answer.toLowerCase();
              let label = answer;
              if (voteAnswerIds[formattedMessageIndex]) {
                label = intl.formatMessage(voteAnswerIds[formattedMessageIndex]);
              }

              return (
                <div
                  key={answer}
                  className={styles.pollButtonWrapper}
                >
                  <Button
                    disabled={!isGreenlightConnected}
                    className={styles.pollingButton}
                    color="primary"
                    size="md"
                    label={label}
                    key={answer}
                    onClick={() => handleVote(info.id, vote.voteId, answer)}
                    aria-labelledby={`pollAnswerLabel${answer}`}
                    aria-describedby={`pollAnswerDesc${answer}`}
                  />
                  <div
                    className={styles.hidden}
                    id={`pollAnswerLabel${answer}`}
                  >
                    {intl.formatMessage(intlMessages.pollAnswerLabel, { 0: label })}
                  </div>
                  <div
                    className={styles.hidden}
                    id={`pollAnswerDesc${answer}`}
                  >
                    {intl.formatMessage(intlMessages.pollAnswerDesc, { 0: label })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>);
  }
}

export default injectIntl(injectWbResizeEvent(Voting));

/*Voting.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  handleVote: PropTypes.func.isRequired,
  vote: PropTypes.shape({
    voteId: PropTypes.string.isRequired,
    answers: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  }).isRequired,
};*/
