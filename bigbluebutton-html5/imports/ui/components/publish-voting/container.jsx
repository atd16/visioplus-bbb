import React from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import Users from '/imports/api/users';
import Auth from '/imports/ui/services/auth';
import PublishVotingComponent from './component';

const VOTING_ENABLED = Meteor.settings.public.vote.enabled;

const PublishVotingContainer = ({ votePublished, isPublishVotingClosed, ...props }) => {
  const currentUser = Users.findOne({ userId: Auth.userID });
  const showVote = votePublished && VOTING_ENABLED && !isPublishVotingClosed;
  if (showVote) {
    return (
      <PublishVotingComponent votePublished={votePublished} {...props} />
    )
  }
  return null;
};

export default PublishVotingContainer;
