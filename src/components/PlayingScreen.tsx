import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';
import {
  StoreState,
  MatchInfo,
  GameSpec,
  UserIdToInfo,
  CSSPropertiesIndexer,
  RouterMatchParams,
  WindowDimensions
} from '../types/index';
import { connect } from 'react-redux';
import { History } from 'history';
import { getOpponents, findMatch, isBoardFullWidth, getBoardRatio } from '../globals';
import { videoChat } from '../services/videoChat';
import RaisedButton from 'material-ui/RaisedButton';
import Chip from 'material-ui/Chip';
import PersonAdd from 'material-ui/svg-icons/social/person-add';
import StartCall from 'material-ui/svg-icons/communication/call';
// import EndCall from 'material-ui/svg-icons/communication/call-end';
import { green500 } from 'material-ui/styles/colors';

interface PlayingScreenPropsFromState {
  myUserId: string;
  userIdToInfo: UserIdToInfo;
  matchInfo: MatchInfo | undefined;
  gameSpec: GameSpec | undefined;

  // To ensure the component rerenders when dimensions change.
  windowDimensions: WindowDimensions | undefined;
}
interface PlayingScreenProps extends PlayingScreenPropsFromState {
  match: RouterMatchParams;
  history: History;
}

const styles: CSSPropertiesIndexer = {
  playingScreenContainerRow: {
    display: 'flex',
    flexDirection: 'row'
  },
  playingScreenContainerColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  chipsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  chipsColumn: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap'
  },
  chip: {
    margin: 4
  },
  chatArea: {
    flexGrow: 1,
    margin: 2
  },
  inviteFriendBtn: {
    margin: 10
  }
};

class PlayingScreen extends React.Component<PlayingScreenProps, {}> {
  state = {
    isCallOngoing: false
  };

  render() {
    if (!this.props.matchInfo) {
      return <div>The matchId doesn't exist.</div>;
    } else if (!this.props.gameSpec) {
      const screenShot = this.props.matchInfo!.game.screenShot;
      let gameSpecScreenShot = screenShot.downloadURL;
      let screenShotWidth = screenShot.width;
      let screenShotHeight = screenShot.height;
      const ratio = getBoardRatio(screenShot);
      document.getElementById('loadingSpinner')!.style.display = 'block';
      return (
        <>
          <div style={styles.playingScreenContainer}>
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
      opponents.length >= 1 && videoChat.isSupported() && this.state.isCallOngoing;
    console.log('showVideoArea=', showVideoArea, 'opponents=', opponents);
    const videoArea = !showVideoArea ? null : (
      <VideoArea
        opponents={opponents}
        gameSpec={this.props.gameSpec}
        windowDimensions={this.props.windowDimensions}
      />
    );
    // I removed the leave option (you can click on back arrow to leave)
    const inviteFriend =
      this.props.matchInfo!.participantsUserIds.length > 1 ? (
        this.state.isCallOngoing ? null : (
          <RaisedButton
            style={{ color: green500 }}
            onClick={() => {
              this.setState({
                isCallOngoing: !this.state.isCallOngoing
              });
            }}
            label={'Call'}
            icon={<StartCall color={green500} />}
            primary={true}
          />
        )
      ) : (
        <RaisedButton
          onClick={() => {
            this.props.history.push('/contactsList/' + this.props.matchInfo!.matchId);
          }}
          label="Invite"
          style={styles.inviteFriendBtn}
          icon={<PersonAdd />}
          primary={true}
        />
      );
    const boardImage = this.props.gameSpec.board;
    const isFullWidth = isBoardFullWidth(boardImage);
    console.log('isFullWidth=', isFullWidth);
    const opponentsArea = this.state.isCallOngoing ? null : (
      <div style={isFullWidth ? styles.chipsRow : styles.chipsColumn}>
        {opponents.map(opponent => (
          <Chip key={opponent.userId} style={styles.chip}>
            {opponent.name}
          </Chip>
        ))}
      </div>
    );
    return (
      <div
        style={isFullWidth ? styles.playingScreenContainerColumn : styles.playingScreenContainerRow}
      >
        <Board matchInfo={this.props.matchInfo!} gameSpec={this.props.gameSpec} />
        <div style={styles.chatArea}>
          {inviteFriend}
          {opponentsArea}
          {videoArea}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (
  state: StoreState,
  ownProps: PlayingScreenProps
): PlayingScreenPropsFromState => {
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
    userIdToInfo: state.userIdToInfo,
    windowDimensions: state.windowDimensions
  };
};

export default connect(mapStateToProps)(PlayingScreen);
