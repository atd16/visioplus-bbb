import React, { Component } from 'react';
import { withModalMounter } from '/imports/ui/components/modal/service';
import Modal from '/imports/ui/components/modal/simple/component';
import Button from '/imports/ui/components/button/component';

import { defineMessages, injectIntl } from 'react-intl';

import { styles } from './styles';

const intlMessages = defineMessages({
  start: {
    id: 'app.streaming.start',
    description: 'Start streaming',
  },
  urlError: {
    id: 'app.streaming.urlError',
    description: 'Not a streaming URL error',
  },
  input: {
    id: 'app.streaming.input',
    description: 'Streaming URL',
  },
  urlInput: {
    id: 'app.streaming.urlInput',
    description: 'URL input field placeholder',
  },
  title: {
    id: 'app.streaming.title',
    description: 'Modal title',
  },
  close: {
    id: 'app.streaming.close',
    description: 'Close',
  },
  note: {
    id: 'app.streaming.noteLabel',
    description: 'provides hint about streaming',
  },
});

class StreamingModal extends Component {
  constructor(props) {
    super(props);

    const { videoUrl } = props;

    this.state = {
      url: "",
    };

    this.startStreamingHandler = this.startStreamingHandler.bind(this);
    this.updateStreamingUrlHandler = this.updateStreamingUrlHandler.bind(this);
    this.renderUrlError = this.renderUrlError.bind(this);
  }

  startStreamingHandler() {
    const {
      startStreaming,
      closeModal,
      handleStreamingStart,
    } = this.props;

    const { url } = this.state;

    startStreaming(url);
    handleStreamingStart();
    closeModal();
  }

  updateStreamingUrlHandler(value) {
    this.setState({ url: value });
  }

  renderUrlError() {
    const { intl } = this.props;
    const { url } = this.state;

    const valid = (!url || url.length <= 3);

    return (
      !valid
        ? (
          <div className={styles.urlError}>
            {intl.formatMessage(intlMessages.urlError)}
          </div>
        )
        : null
    );
  }

  render() {
    const { intl, closeModal } = this.props;
    const { url } = this.state;

    return (
      <Modal
        overlayClassName={styles.overlay}
        className={styles.modal}
        onRequestClose={closeModal}
        contentLabel={intl.formatMessage(intlMessages.title)}
        hideBorder
      >
        <header data-test="videoModealHeader" className={styles.header}>
          <h3 className={styles.title}>{intl.formatMessage(intlMessages.title)}</h3>
        </header>

        <div className={styles.content}>
          <div className={styles.streamingUrl}>
            <label htmlFor="video-modal-input" id="video-modal-input">
              {intl.formatMessage(intlMessages.input)}
              <input
                id="video-modal-input"
                onChange={event => this.updateStreamingUrlHandler(event.target.value)}
                name="video-modal-input"
                placeholder={intl.formatMessage(intlMessages.urlInput)}
                aria-describedby="streaming-note"
              />
            </label>
            <div className={styles.streamingNote} id="streaming-note">
              {intl.formatMessage(intlMessages.note)}
            </div>
          </div>

          <Button
            className={styles.startBtn}
            label={intl.formatMessage(intlMessages.start)}
            onClick={this.startStreamingHandler}
          />
        </div>
      </Modal>
    );
  }
}

export default injectIntl(withModalMounter(StreamingModal));
