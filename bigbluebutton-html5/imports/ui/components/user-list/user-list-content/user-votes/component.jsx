import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import Icon from '/imports/ui/components/icon/component';
import { Session } from 'meteor/session';
import { styles } from '/imports/ui/components/user-list/user-list-content/styles';

const intlMessages = defineMessages({
  voteLabel: {
    id: 'app.vote.votePaneTitle',
    description: 'label for user-list vote button',
  },
});

class UserVotes extends PureComponent {
  render() {
    const handleClickToggleVote = () => {
      Session.set(
        'openPanel',
        Session.get('openPanel') === 'vote'
          ? 'userlist'
          : 'vote',
      );
    };

    const {
      intl,
      isPresenter,
      voteIsOpen,
      forceVoteOpen,
    } = this.props;

    if (!isPresenter) return null;
    if (!voteIsOpen && !forceVoteOpen) return null;

    return (
      <div className={styles.messages}>
        <div className={styles.container}>
          <h2 className={styles.smallTitle}>
            {intl.formatMessage(intlMessages.voteLabel)}
          </h2>
        </div>
        <div className={styles.list}>
          <div className={styles.scrollableList}>
            <div
              role="button"
              tabIndex={0}
              className={styles.listItem}
              onClick={handleClickToggleVote}
            >
              <Icon iconName="voting" />
              <span>{intl.formatMessage(intlMessages.voteLabel)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(UserVotes);

UserVotes.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  isPresenter: PropTypes.bool.isRequired,
  voteIsOpen: PropTypes.bool.isRequired,
  forceVoteOpen: PropTypes.bool.isRequired,
};
