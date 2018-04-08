import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';
import {
  StoreState,
  MatchInfo,
  GameSpecs,
  GameSpec,
  UserIdToPhoneNumber,
  PhoneNumberToContact
} from '../types/index';
import { connect } from 'react-redux';
import { FloatingActionButton } from 'material-ui';
import ContentAdd from 'material-ui/svg-icons/content/add';
import { History } from 'history';
import CanvasImage from './CanvasImage';
import { Layer, Stage } from 'react-konva';
import { getOpponents } from '../globals';

interface PlayingScreenProps {
  myUserId: string;
  userIdToPhoneNumber: UserIdToPhoneNumber;
  phoneNumberToContact: PhoneNumberToContact;
  matchesList: MatchInfo[];
  gameSpecs: GameSpecs;
  match: {
    params: {
      matchId: string;
    };
  };
  history: History;
}

class PlayingScreen extends React.Component<PlayingScreenProps, {}> {
  matchInfo: MatchInfo;
  gameSpec: GameSpec;

  constructor(props: PlayingScreenProps) {
    super(props);

    for (let match of this.props.matchesList) {
      if (this.props.match.params.matchId === match.matchId) {
        this.matchInfo = match;
        this.gameSpec = this.props.gameSpecs.gameSpecIdToGameSpec[
          match.gameSpecId
        ];
      }
    }
  }

  // TODO move this all to PlayingScreen
  componentDidUpdate() {
    for (let match of this.props.matchesList) {
      if (this.props.match.params.matchId === match.matchId) {
        this.matchInfo = match;
        this.gameSpec = this.props.gameSpecs.gameSpecIdToGameSpec[
          match.gameSpecId
        ];
      }
    }
  }

  render() {
    if (!this.matchInfo) {
      return <div>The matchId doesn't exist.</div>;
    } else if (!this.gameSpec) {
      let gameSpecScreenShot = this.matchInfo.game.screenShot.downloadURL;
      let screenShotWidth = this.matchInfo.game.screenShot.width;
      let screenShotHeight = this.matchInfo.game.screenShot.height;
      let screenShotLayer = (
        <CanvasImage
          height={screenShotHeight}
          width={screenShotWidth}
          src={gameSpecScreenShot}
        />
      );
      // TODO show a spinner over the screenshot
      document.getElementById('loadingSpinner')!.style.display = 'block';
      return (
        <>
          {/* <AppBar
                      showMenuIconButton={false}
                      title={
                        <span>Match: {this.matchInfo.game.gameName} (No game spec)</span>
                      }
                    /> */}
          <div>The Gamespec has not been loaded.</div>
          <Stage width={screenShotWidth} height={screenShotHeight}>
            <Layer ref={() => 'screenShotLayer'}>{screenShotLayer}</Layer>
          </Stage>
        </>
      );
    }
    const participantsUserIds = this.matchInfo.participantsUserIds;
    const opponents = getOpponents(
      participantsUserIds,
      this.props.myUserId,
      this.props.userIdToPhoneNumber,
      this.props.phoneNumberToContact
    );
    return (
      <div>
        <Board matchInfo={this.matchInfo} gameSpec={this.gameSpec} />
        <VideoArea opponents={opponents} />
        <FloatingActionButton
          style={{ marginRight: 20 }}
          onClick={() =>
            this.props.history.push('/contactsList/' + this.matchInfo.matchId)
          }
        >
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  return {
    matchesList: state.matchesList,
    gameSpecs: state.gameSpecs,
    myUserId: state.myUser.myUserId,
    userIdToPhoneNumber: state.userIdsAndPhoneNumbers.userIdToPhoneNumber,
    phoneNumberToContact: state.phoneNumberToContact
  };
};
export default connect(mapStateToProps)(PlayingScreen);
