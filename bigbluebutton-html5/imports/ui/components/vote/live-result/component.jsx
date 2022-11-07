import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import { styles } from './styles';
import Service from './service';

const intlMessages = defineMessages({
  usersTitle: {
    id: 'app.poll.liveResult.usersTitle',
    description: 'heading label for poll users',
  },
  responsesTitle: {
    id: 'app.poll.liveResult.responsesTitle',
    description: 'heading label for poll responses',
  },
  publishLabel: {
    id: 'app.poll.publishLabel',
    description: 'label for the publish button',
  },
  backLabel: {
    id: 'app.poll.backLabel',
    description: 'label for the return to poll options button',
  },
  doneLabel: {
    id: 'app.createBreakoutRoom.doneLabel',
    description: 'label shown when all users have responded',
  },
  waitingLabel: {
    id: 'app.poll.waitingLabel',
    description: 'label shown while waiting for responses',
  },
});

const getResponseString = (obj) => {
  const { children } = obj.props;
  if (typeof children !== 'string') {
    return getResponseString(children[1]);
  }
  return children;
};

class LiveResult extends PureComponent {
  static getDerivedStateFromProps(nextProps) {
    const answers = ["yes", "no", "abs"]
    const {
      vote,
      adminInfos,
      voteAnswerIds,
      intl
    } = nextProps;

    if (!vote || !adminInfos) return null;

    const userAnswers = adminInfos.vote_results
    let printUserAnswers = []

    if (userAnswers) {
      for (var answer in userAnswers) {
        let answerObj = userAnswers[answer]
        let formattedMessageIndex = answerObj.value.toLowerCase();
        printUserAnswers.push(
          <tr key={_.uniqueId('stats-')}>
            <td className={styles.resultLeft}>{answerObj.username}</td>
            <td className={styles.resultRight}>
              {
                voteAnswerIds[formattedMessageIndex]
                  ? intl.formatMessage(voteAnswerIds[formattedMessageIndex])
                  : formattedMessageIndex
              }
            </td>
          </tr>
        )
      }
    }

    const voteStats = adminInfos.totals
    let printVoteStats = []

    answers.map((answer) => {
      const pct = Math.round(voteStats[""+answer+"_percentage"])
      const pctFormatted = `${Number.isNaN(pct) ? 0 : pct}%`;
      const numVotes = voteStats[""+answer+"_count"]

      const calculatedWidth = {
        width: pctFormatted,
      };

      return printVoteStats.push(
        <div className={styles.main} key={_.uniqueId('stats-')}>
          <div className={styles.left}>
            {
              voteAnswerIds[answer]
                ? intl.formatMessage(voteAnswerIds[answer])
                : answer
            }
          </div>
          <div className={styles.center}>
            <div className={styles.barShade} style={calculatedWidth} />
            <div className={styles.barVal}>{numVotes || 0}</div>
          </div>
          <div className={styles.right}>
            {pctFormatted}
          </div>
        </div>
      )
    })

    return {
      printVoteStats,
      printUserAnswers,
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      printVoteStats: null,
      printUserAnswers: null,
    };
  }

  render() {
    const {
      vote,
      adminInfos,
      isGreenlightConnected,
      intl,
      publishVote,
      handleBackClick,
    } = this.props;

    const { printUserAnswers, printVoteStats } = this.state;

    let waiting;
    let userCount = 0;
    let respondedCount = 0;

    if(!adminInfos || !vote){
      return null
    }
    let userAnswers = adminInfos.vote_results
    let voteStats = adminInfos.totals

    waiting = voteStats.total_count !== voteStats.num_respondents

    return (
      <div>
        <div className={styles.stats}>
          {printVoteStats}
        </div>
        <div className={styles.status}>
          {waiting
            ? (
              <span>
                {`${intl.formatMessage(intlMessages.waitingLabel, {
                  0: voteStats.total_count,
                  1: voteStats.num_respondents,
                })} `}
              </span>
            )
            : <span>{intl.formatMessage(intlMessages.doneLabel)}</span>}
          {waiting
            ? <span className={styles.connectingAnimation} /> : null}
        </div>
        {vote
          ? (
            <Button
              disabled={!isGreenlightConnected}
              onClick={() => {
                publishVote(vote.voteId);
              }}
              label={intl.formatMessage(intlMessages.publishLabel)}
              color="primary"
              className={styles.btn}
            />
          ) : (
            <Button
              disabled={!isGreenlightConnected}
              onClick={() => {
                handleBackClick();
              }}
              label={intl.formatMessage(intlMessages.backLabel)}
              color="default"
              className={styles.btn}
            />
          )
        }
        <table>
          <tbody>
            <tr>
              <th className={styles.theading}>{intl.formatMessage(intlMessages.usersTitle)}</th>
              <th className={styles.theading}>{intl.formatMessage(intlMessages.responsesTitle)}</th>
            </tr>
            {printUserAnswers}
          </tbody>
        </table>
      </div>
    );
  }
}

export default injectIntl(LiveResult);

LiveResult.defaultProps = { currentVote: null };

LiveResult.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  handleBackClick: PropTypes.func.isRequired,
};
