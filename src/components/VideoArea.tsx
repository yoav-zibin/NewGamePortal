import * as React from 'react';
import { CSSPropertiesIndexer, Opponent } from '../types/index';
import { videoChat } from '../services/videoChat';

const styles: CSSPropertiesIndexer = {
  displayInline: {
    display: 'inline-block'
  },
  videoChatPeer: {
    position: 'relative',
    padding: 0,
    margin: 0,
    width: '150px',
    height: '150px',
    'min-width': '150px',
    'max-width': '150px',
    'min-height': '150px',
    'max-height': '150px'
  },
  hideVideo: {
    display: 'none'
  },
  /* http://vanseodesign.com/css/vertical-centering/ */
  forVerticalCenteringParent: {
    display: 'table'
  },
  forVerticalCenteringChild: {
    display: 'table-cell',
    'vertical-align': 'middle',
    'text-align': 'center',
    'font-size': '16px'
  }
};

interface Props {
  opponents: Opponent[];
}

class VideoArea extends React.Component<Props, {}> {
  isShown() {
    const opponents = this.props.opponents;
    return opponents.length > 1 && videoChat.isSupported();
  }

  componentDidMount() {
    if (!this.isShown()) {
      return;
    }
    videoChat.getUserMedia().then(() => {
      videoChat.updateOpponents(
        this.props.opponents.map(opponent => opponent.userId)
      );
    });
  }

  componentWillUnmount() {
    videoChat.stopUserMedia();
  }

  render() {
    const opponents = this.props.opponents;
    if (!this.isShown()) {
      return null;
    }
    const participants = opponents.concat();
    participants.unshift({ userId: 'Me', name: 'Me' });
    return (
      <>
        {participants.map((participant, index) => (
          <div
            key={participant.userId}
            style={{ ...styles.videoChatPeer, ...styles.displayInline }}
          >
            <video
              style={{ ...styles.videoChatPeer, ...styles.hideVideo }}
              id={'videoElement' + index}
            />
            <div
              id={'videoParticipantName' + index}
              style={{
                ...styles.videoChatPeer,
                ...styles.forVerticalCenteringParent
              }}
            >
              <div style={styles.videoChatPeer}>{participant.name}</div>
            </div>
          </div>
        ))}
      </>
    );
  }
}

export default VideoArea;
