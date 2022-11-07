import React from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import Users from '/imports/api/users';
import Auth from '/imports/ui/services/auth';
import VotingComponent from './component';

const VOTING_ENABLED = Meteor.settings.public.vote.enabled;

const VotingContainer = ({ vote, voteInfos, ...props }) => {
  const currentUser = Users.findOne({ userId: Auth.userID }, { fields: { presenter: 1 } });
  const showVoting = vote && VOTING_ENABLED;
  if (showVoting) {
    return (
      voteInfos.map((info) => {
          if(!info.voted && ((info.status=="v" && info.voting_uid == Auth.externUserID) || (info.status=="p" && info.proxy_uid == Auth.externUserID)))
            return (<VotingComponent key={info.id} vote={vote} info={info} {...props} />)
      })
    );
  }
  return null;
};

export default VotingContainer;
