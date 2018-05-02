import * as React from 'react';
import { CSSPropertiesIndexer, Opponent } from '../types/index';
import { videoChat } from '../services/videoChat';
import { checkCondition } from '../globals';

const styles: CSSPropertiesIndexer = {
  videoChatItem: {
    width: '150px',
    height: '150px',
    minWidth: '150px',
    maxWidth: '150px',
    minHeight: '150px',
    maxHeight: '150px'
  },
  videoChatContainer: {
    display: 'flex',  
    alignItems: 'center',
    justifyContent: 'space-around',
    flexFlow: 'row wrap'
  },
  centerItem: {
    textAlign: 'center',
    lineHeight: '150px',
    width: '150px',
    height: '150px'
  }
};

interface Props {
  opponents: Opponent[];
}

class VideoArea extends React.Component<Props> {
  componentDidMount() {
    videoChat.getUserMedia().then(() => {
      if (videoChat.isSupported()) {
        videoChat.updateOpponents(
          this.props.opponents.map(opponent => opponent.userId)
        );
      }
    });
  }

  componentWillUnmount() {
    videoChat.stopUserMedia();
  }

  render() {
    const opponents = this.props.opponents;
    checkCondition('VideoArea', opponents.length >= 1);
    if (!videoChat.isSupported()) {
      return null;
    }
    const participants = opponents.concat();
    participants.unshift({ userId: 'Me', name: 'Me' });

    return (
      <div style={styles.videoChatContainer}>
        {participants.map((participant, index) => (
          <div key={participant.userId} style={styles.videoChatItem}>
            <video id={'videoElement' + index} />
            <div id={'videoParticipantName' + index} style={styles.centerItem}>
              {participant.name}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export default VideoArea;
