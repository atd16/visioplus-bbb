import Auth from '/imports/ui/services/auth';
import { check } from 'meteor/check';
import logger from '/imports/startup/client/logger';
import { notify } from '/imports/ui/services/notification';

const getHostname = (url) => {
  return new URL(url).hostname;
}

function notifyApiResponse(message, error = false, icon = 'unmute') {
   notify(
      message,
      error ? 'error' : 'info',
      icon,
    );
  }

/**
 * Send the request to the server via Meteor.call and don't treat errors.
 *
 * @param {string} name
 * @param {any} args
 * @see https://docs.meteor.com/api/methods.html#Meteor-call
 * @return {Promise}
 */
export function makeCall(name, ...args) {
  check(name, String);

  // const { credentials } = Auth;

  return new Promise((resolve, reject) => {
    if (Meteor.status().connected) {
      Meteor.call(name, ...args, (error, result) => {
        if (error) {
          reject(error);
        }

        resolve(result);
      });
    } else {
      const failureString = `Call to ${name} failed because Meteor is not connected`;
      // We don't want to send a log message if the call that failed was a log message.
      // Without this you can get into an endless loop of failed logging.
      if (name !== 'logClient') {
        logger.warn({
          logCode: 'servicesapiindex_makeCall',
          extraInfo: {
            attemptForUserInfo: Auth.fullInfo,
            name,
            ...args,
          },
        }, failureString);
      }
      reject(failureString);
    }
  });
}

export function makeStreamingApiCall(name, args) {
  const xhr = new XMLHttpRequest();

  xhr.open('POST', "https://"+getHostname(Auth.logoutURL)+"/stream/"+name+"/"+Auth.externMeetingID);
  xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');

  xhr.onload = function () {
    //this.notify(this.responseText);
    notifyApiResponse(this.responseText);
    console.log(this.responseText);
  }
 
  params = ""
  for (const [key, value] of Object.entries(args)) {
    params += key+"="+value+"&";
  }
  params = params.slice(0, -1);

  xhr.send(params);
}
