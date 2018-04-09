import * as React from 'react';
import { CSSPropertiesIndexer, Opponent } from '../types/index';
import { videoChat } from '../services/videoChat';
import { checkCondition } from '../globals';

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
    minWidth: '150px',
    maxWidth: '150px',
    minHeight: '150px',
    maxHeight: '150px'
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
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: '16px'
  }
};

interface Props {
  opponents: Opponent[];
}

class VideoArea extends React.Component<Props, {}> {
  componentDidMount() {
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
    checkCondition(
      'VideoArea',
      opponents.length >= 1 && videoChat.isSupported()
    );
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
              <div style={styles.forVerticalCenteringChild}>
                {participant.name}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }
}

export default VideoArea;
