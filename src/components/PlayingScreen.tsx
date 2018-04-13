import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';
import {
  StoreState,
  MatchInfo,
  GameSpecs,
  GameSpec,
  UserIdToPhoneNumber,
  PhoneNumberToContact,
  CSSPropertiesIndexer,
  RouterMatchParams
} from '../types/index';
import { connect } from 'react-redux';
import { FloatingActionButton } from 'material-ui';
import ContentAdd from 'material-ui/svg-icons/content/add';
import { History } from 'history';
import CanvasImage from './CanvasImage';
import { Layer, Stage } from 'react-konva';
import { getOpponents } from '../globals';
import { videoChat } from '../services/videoChat';

interface PlayingScreenProps {
  myUserId: string;
  userIdToPhoneNumber: UserIdToPhoneNumber;
  phoneNumberToContact: PhoneNumberToContact;
  matchesList: MatchInfo[];
  gameSpecs: GameSpecs;
  match: RouterMatchParams;
  history: History;
}

const styles: CSSPropertiesIndexer = {
  videoChatContainer: {
    padding: 0,
    margin: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    minHeight: '160px',
    overflowY: 'scroll',
    /*
      font-size is 0 to avoid spaces between the inline video elements after linebreak.
      see https://css-tricks.com/fighting-the-space-between-inline-block-elements/
    */
    fontSize: 0
  }
};

class PlayingScreen extends React.Component<PlayingScreenProps, {}> {
  // todo: remove
  matchInfo: MatchInfo;
  gameSpec: GameSpec;

  render() {
    let matchInfo: MatchInfo | undefined;
    let gameSpec: GameSpec | undefined;

    for (let match of this.props.matchesList) {
      if (this.props.match.params.matchIdInRoute === match.matchId) {
        matchInfo = match;
        gameSpec = this.props.gameSpecs.gameSpecIdToGameSpec[
          match.gameSpecId
        ];
      }
    }

    if (!matchInfo) {
      return <div>The matchId doesn't exist.</div>;
    } else if (!gameSpec) {
      let gameSpecScreenShot = matchInfo!.game.screenShot.downloadURL;
      let screenShotWidth = matchInfo!.game.screenShot.width;
      let screenShotHeight = matchInfo!.game.screenShot.height;
      const ratio = Math.min(
        window.innerWidth / screenShotWidth,
        window.innerHeight / screenShotHeight
      );
      let screenShotLayer = (
        <CanvasImage
          height={screenShotHeight * ratio}
          width={screenShotWidth * ratio}
          src={gameSpecScreenShot}
        />
      );
      document.getElementById('loadingSpinner')!.style.display = 'block';
      return (
        <>
          <div>The Gamespec has not been loaded.</div>
          <Stage
            width={screenShotWidth * ratio}
            height={screenShotHeight * ratio}
          >
            <Layer ref={() => 'screenShotLayer'}>{screenShotLayer}</Layer>
          </Stage>
        </>
      );
    }
    document.getElementById('loadingSpinner')!.style.display = 'none';
    const participantsUserIds = matchInfo!.participantsUserIds;
    const opponents = getOpponents(
      participantsUserIds,
      this.props.myUserId,
      this.props.userIdToPhoneNumber,
      this.props.phoneNumberToContact
    );
    const showVideoArea = opponents.length >= 1 && videoChat.isSupported();
    console.log('showVideoArea=', showVideoArea, 'opponents=', opponents);
    const videoArea = !showVideoArea ? null : (
      <div style={styles.videoChatContainer}>
        <VideoArea opponents={opponents} />
      </div>
    );
    return (
      <div>
        <Board matchInfo={matchInfo!} gameSpec={gameSpec} />
        {videoArea}
        <FloatingActionButton
          style={{ marginRight: 20 }}
          onClick={() =>
            this.props.history.push('/contactsList/' + matchInfo!.matchId)
          }
        >
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState, ownProps: PlayingScreenProps) => {
  console.log();
  // TODO: filter here!!!
  // use router props in mapStateToProps so this component will just
  // need the current match and current game spec.
  // const mapStateToProps = (state: StoreState, ownProps: PlayingScreenProps) => {
  //     // Use props injected by React Router
  //     const selectedSlugs = ownProps.params.selectedSlugs.split(';');
  // }
  return {
    matchesList: state.matchesList,
    gameSpecs: state.gameSpecs,
    myUserId: state.myUser.myUserId,
    userIdToPhoneNumber: state.userIdsAndPhoneNumbers.userIdToPhoneNumber,
    phoneNumberToContact: state.phoneNumberToContact
  };
};



export default connect(mapStateToProps)(PlayingScreen);
