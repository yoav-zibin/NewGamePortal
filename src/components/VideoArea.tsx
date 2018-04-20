import * as React from 'react';
import { CSSPropertiesIndexer, Opponent } from '../types/index';
import { videoChat } from '../services/videoChat';
import { checkCondition } from '../globals';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

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

// TODO: sorry, let's remove pre-premissions!
interface VideoAreaState {
  openDialog: boolean;
  permissionForVideo: boolean;
}

class VideoArea extends React.Component<Props, VideoAreaState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      openDialog: true,
      permissionForVideo: false
    };
  }

  componentDidMount() {
    videoChat.getUserMedia().then(() => {
      if (this.state.permissionForVideo && videoChat.isSupported()) {
        videoChat.updateOpponents(
          this.props.opponents.map(opponent => opponent.userId)
        );
      }
    });
  }

  componentDidUpdate() {
    videoChat.getUserMedia().then(() => {
      if (this.state.permissionForVideo && videoChat.isSupported()) {
        videoChat.updateOpponents(
          this.props.opponents.map(opponent => opponent.userId)
        );
      }
    });
  }

  componentWillUnmount() {
    videoChat.stopUserMedia();
  }

  handleAllow = () => {
    this.setState({
      permissionForVideo: true,
      openDialog: false
    });
  };

  handleDeny = () => {
    this.setState({
      permissionForVideo: false,
      openDialog: false
    });
  };

  render() {
    const opponents = this.props.opponents;
    checkCondition('VideoArea', opponents.length >= 1);
    if (!videoChat.isSupported()) {
      return null;
    }
    const participants = opponents.concat();
    participants.unshift({ userId: 'Me', name: 'Me' });

    const action1 = (
      <FlatButton
        key="denyPermission"
        label="No"
        primary={true}
        onClick={this.handleDeny}
      />
    );
    const action2 = (
      <FlatButton
        key="allowPermission"
        label="Yes"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleAllow}
      />
    );
    const actions = [action1, action2];

    return (
      <>
        <Dialog
          title="Access for video"
          actions={actions}
          modal={true}
          open={this.state.openDialog}
        >
          GamePortal needs access to your camera for video chat.
        </Dialog>
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
