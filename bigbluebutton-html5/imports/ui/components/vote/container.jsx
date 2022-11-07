import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Auth from '/imports/ui/services/auth';
import Presentations from '/imports/api/presentations';
import PresentationAreaService from '/imports/ui/components/presentation/service';
import Vote from '/imports/ui/components/vote/component';
import Service from './service';

const VoteContainer = ({ ...props }) => <Vote {...props} />;

export default withTracker(() => ({
  amIPresenter: Service.amIPresenter(),
  resetVotePanel: Session.get('resetVotePanel') || false,
  voteAnswerIds: Service.voteAnswerIds,
}))(VoteContainer);
