import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
import _ from 'lodash';
import { styles } from './styles.scss';
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
  closeLabel: {
    id: 'app.vote.closeLabel',
    description: 'label for vote pane close button',
  },
});

class PublishVoting extends Component {
  constructor(props) {
    super(props);

    this.play = this.play.bind(this);
  }

  componentDidMount() {
    this.play();
  }

  play() {
    this.alert = new Audio(`${Meteor.settings.public.app.cdn + Meteor.settings.public.app.basename}/resources/sounds/Poll.mp3`);
    this.alert.play();
  }

  render() {
    const {
      votePublished,
      intl,
      closePublishVoting
    } = this.props;
    const voteAnswerIds = VoteService.voteAnswerIds
    const answers = ["yes", "no", "abs"];
    const stackOptions = false;
    const pollAnswerStyles = {
      [styles.pollingAnswers]: true,
      [styles.removeColumns]: answers.length === 1,
      [styles.stacked]: stackOptions,
    };

    let printVoteStats = []
    answers.map((answer) => {
      const pct = Math.round(votePublished.infos.totals[""+answer+"_percentage"])
      const pctFormatted = `${Number.isNaN(pct) ? 0 : pct}%`;
      const numVotes = votePublished.infos.totals[""+answer+"_count"]

      const calculatedWidth = {
        width: pctFormatted,
      };

      if(answer == "abs"){
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
              <div className={styles.barVal}>{numVotes || 0}</div>
            </div>
          </div>
        )
      }

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

    return (
      <div className={styles.overlay}>
        <div
          className={cx({
            [styles.pollingContainer]: true,
            [styles.autoWidth]: stackOptions,
          })}
          role="alert"
        >
        <div className="clearfix">
          <Button
            label={intl.formatMessage(intlMessages.closeLabel)}
            onClick={() => {
              closePublishVoting()
            }}
            className={styles.closeBtn}
            style={{float: "right"}}
            icon="close"
            size="sm"
            hideLabel
          />
          <div className={styles.pollingTitle}>
            {votePublished.description}
          </div>
          <div className={styles.stats}>
            {printVoteStats}
          </div>
          </div>
        </div>
      </div>);
  }
}

export default injectIntl(injectWbResizeEvent(PublishVoting));
