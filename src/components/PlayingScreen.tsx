import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';
import { StoreState, MatchInfo, GameSpec } from '../types/index';
import { connect } from 'react-redux';
import CanvasImage from './CanvasImage';
import { AppBar } from 'material-ui';
import { Layer, Stage } from 'react-konva';

interface PlayingScreenProps {
  // pieces: Piece[];
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  // myUserId: string;
}

class PlayingScreen extends React.Component<PlayingScreenProps, {}> {
  constructor(props: PlayingScreenProps) {
    super(props);
  }
  render() {
    const props = this.props;
    if (!props.gameSpec) {
      let gameSpecScreenShot = props.matchInfo.game.screenShot.downloadURL;
      let width = props.matchInfo.game.screenShot.width;
      let height = props.matchInfo.game.screenShot.height;
      let screenShotLayer = (
        <CanvasImage height={height} width={width} src={gameSpecScreenShot} />
      );
      return (
        <>
          <AppBar
            showMenuIconButton={false}
            title={<span>Match: {props.matchInfo.game.gameName}</span>}
          />
          <Stage width={width} height={height}>
            <Layer ref={() => 'screenShotLayer'}>{screenShotLayer}</Layer>
          </Stage>
        </>
      );
    }

    return (
      <div>
        <Board />
        <VideoArea />
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  if (state.currentMatchIndex === -1) {
    return {};
  }
  return {
    // pieces:
    //     state.gameSpecs.gameSpecIdToGameSpec[
    //         state.matchesList[state.currentMatchIndex].game.gameSpecId
    //     ].pieces,
    matchInfo: state.matchesList[state.currentMatchIndex],
    gameSpec:
      state.gameSpecs.gameSpecIdToGameSpec[
        state.matchesList[state.currentMatchIndex].game.gameSpecId
      ]
    // myUserId: state.myUser.myUserId
  };
};

const mapDispatchToProps = () => ({});
export default connect(mapStateToProps, mapDispatchToProps)(PlayingScreen);
