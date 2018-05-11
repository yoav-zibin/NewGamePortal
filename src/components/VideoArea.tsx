import * as React from 'react';
import { CSSPropertiesIndexer, Opponent, WindowDimensions, GameSpec } from '../types/index';
import { videoChat } from '../services/videoChat';

import { checkCondition, isIos, getVideoChatWidthHeight } from '../globals';

function getStyles(videoChatWidthHeight: number): CSSPropertiesIndexer {
  const widthHeight = videoChatWidthHeight + 'px';
  return {
    videoChatItem: {
      width: widthHeight,
      height: widthHeight,
      minWidth: widthHeight,
      maxWidth: widthHeight,
      minHeight: widthHeight,
      maxHeight: widthHeight
    },
    videoChatContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexFlow: 'row wrap'
    },
    centerItem: {
      textAlign: 'center',
      lineHeight: widthHeight,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      backgroundColor: 'yellow',
      width: widthHeight,
      height: widthHeight
    }
  };
}

interface Props {
  opponents: Opponent[];

  // Passed from PlayingScreen
  gameSpec: GameSpec;

  // To ensure the component rerenders when dimensions change.
  windowDimensions: WindowDimensions | undefined;
}

class VideoArea extends React.Component<Props> {
  container: HTMLDivElement | null = null;

  componentDidMount() {
    videoChat.getUserMedia().then(() => {
      if (videoChat.isSupported()) {
        videoChat.updateOpponents(this.props.opponents.map(opponent => opponent.userId));
        this.updateVideoElements();
      }
    });
    this.container!.addEventListener('scroll', this.updateVideoElements);
  }

  componentWillUnmount() {
    videoChat.stopUserMedia();
    this.container!.removeEventListener('scroll', this.updateVideoElements);
  }

  updateVideoElements() {
    if (isIos) {
      window.cordova.plugins.iosrtc.refreshVideos();
    }
  }

  render() {
    const opponents = this.props.opponents;
    const styles: CSSPropertiesIndexer = getStyles(
      getVideoChatWidthHeight(this.props.gameSpec.board, opponents.length + 1)
    );
    checkCondition('VideoArea', opponents.length >= 1);
    if (!videoChat.isSupported()) {
      return null;
    }
    const participants = opponents.concat();
    participants.unshift({ userId: 'Me', name: 'Me' });

    return (
      <div style={styles.videoChatContainer} ref={ele => (this.container = ele)}>
        {participants.map((participant, index) => (
          <div key={participant.userId} style={styles.videoChatItem}>
            <video id={'videoElement' + index} style={styles.videoChatItem} />
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
