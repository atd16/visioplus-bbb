import { makeStreamingApiCall } from '/imports/ui/services/api';

const startStreaming = (url) => {
  makeStreamingApiCall('start', { url:url });
};

const stopStreaming = () => {
  makeStreamingApiCall('stop', {});
};

export {
  startStreaming,
  stopStreaming,
}
