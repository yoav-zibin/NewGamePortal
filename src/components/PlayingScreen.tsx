import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';
import {
  StoreState,
  MatchInfo,
  GameSpec,
  UserIdToInfo,
  CSSPropertiesIndexer,
  RouterMatchParams
} from '../types/index';
import { connect } from 'react-redux';
import { History } from 'history';
import { getOpponents, findMatch } from '../globals';
import { videoChat } from '../services/videoChat';
import RaisedButton from 'material-ui/RaisedButton';

interface PlayingScreenProps {
  myUserId: string;
  userIdToInfo: UserIdToInfo;
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  match: RouterMatchParams;
  history: History;
}

const styles: CSSPropertiesIndexer = {
  playingScreenContainer: {
    overflowY: 'scroll'
  }
};

class PlayingScreen extends React.Component<PlayingScreenProps, {}> {
  state = {
    videoChatButton: false
  };
  render() {
    if (!this.props.matchInfo) {
      return <div>The matchId doesn't exist.</div>;
    } else if (!this.props.gameSpec) {
      let gameSpecScreenShot = this.props.matchInfo!.game.screenShot
        .downloadURL;
      let screenShotWidth = this.props.matchInfo!.game.screenShot.width;
      let screenShotHeight = this.props.matchInfo!.game.screenShot.height;
      const ratio = window.innerWidth / screenShotWidth;
      document.getElementById('loadingSpinner')!.style.display = 'block';
      return (
        <>
          <div style={styles.playingScreenContainer}>
            <div>The Gamespec has not been loaded.</div>
            <img
              height={screenShotHeight * ratio}
              width={screenShotWidth * ratio}
              src={gameSpecScreenShot}
            />
          </div>
        </>
      );
    }

    document.getElementById('loadingSpinner')!.style.display = 'none';
    const participantsUserIds = this.props.matchInfo!.participantsUserIds;
    const opponents = getOpponents(
      participantsUserIds,
      this.props.myUserId,
      this.props.userIdToInfo
    );

    const showVideoArea =
      opponents.length >= 1 &&
      videoChat.isSupported() &&
      this.state.videoChatButton;
    console.log('showVideoArea=', showVideoArea, 'opponents=', opponents);
    const videoArea = !showVideoArea ? null : (
        <VideoArea opponents={opponents} />
    );
    return (
      <div style={styles.playingScreenContainer}>
        <Board
          matchInfo={this.props.matchInfo!}
          gameSpec={this.props.gameSpec}
        />
        {
          <RaisedButton
            onClick={() => {
              this.setState({
                videoChatButton: !this.state.videoChatButton
              });
            }}
            label={this.state.videoChatButton?'Stop VideoChatting':'Start VideoChatting'}
            primary={true}
          />
        }
        {videoArea}
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState, ownProps: PlayingScreenProps) => {
  let matchInfo: MatchInfo | undefined = findMatch(
    state.matchesList,
    ownProps.match.params.matchIdInRoute
  );
  let gameSpec: GameSpec | undefined;
  if (matchInfo) {
    gameSpec = state.gameSpecs.gameSpecIdToGameSpec[matchInfo.gameSpecId];
  }
  return {
    matchInfo: matchInfo,
    gameSpec: gameSpec,
    myUserId: state.myUser.myUserId,
    userIdToInfo: state.userIdToInfo
  };
};

export default connect(mapStateToProps)(PlayingScreen);
