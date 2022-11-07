import Logger from '/imports/startup/server/logger';
import Meetings from '/imports/api/meetings';
import { extractCredentials } from '/imports/api/common/server/helpers';

export default function clearRandomlySelectedUser() {
  const { meetingId, requesterUserId } = extractCredentials(this.userId);

  const selector = {
    meetingId,
  };

  const modifier = {
    $set: {
      randomlySelectedUser: '',
    },
  };

  try {
    const { insertedId } = Meetings.update(selector, modifier);
    if (insertedId) {
      Logger.info(`Cleared randomly selected user from meeting=${meetingId} by id=${requesterUserId}`);
    }
  } catch (err) {
    Logger.error(`Clearing randomly selected user : ${err}`);
  }
}
