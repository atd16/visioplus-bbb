import Users from '/imports/api/users';
import Auth from '/imports/ui/services/auth';

// 'YN' = Yes,No
// 'TF' = True,False
// 'A-2' = A,B
// 'A-3' = A,B,C
// 'A-4' = A,B,C,D
// 'A-5' = A,B,C,D,E

const voteAnswerIds = {
  yes: {
    id: 'app.vote.answer.yes',
    description: 'label for vote answer Yes',
  },
  no: {
    id: 'app.vote.answer.no',
    description: 'label for vote answer No',
  },
  abs: {
    id: 'app.vote.answer.abs',
    description: 'label for vote answer Abstention',
  },
};

export default {
  amIPresenter: () => Users.findOne({ userId: Auth.userID }, { fields: { presenter: 1 } }).presenter,
  voteAnswerIds,
};
