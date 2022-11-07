import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withModalMounter } from '/imports/ui/components/modal/service';
import StreamingModal from './component';
import { startStreaming, stopStreaming } from './service';

const StreamingModalContainer = props => <StreamingModal {...props} />;

export default withModalMounter(withTracker(({ mountModal }) => ({
  closeModal: () => {
    mountModal(null);
  },
  startStreaming,
  stopStreaming,
}))(StreamingModalContainer));
