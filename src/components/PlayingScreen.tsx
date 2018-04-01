import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';
import { StoreState, MatchInfo, GameSpecs, GameSpec } from '../types/index';
import { connect } from 'react-redux';
import CanvasImage from './CanvasImage';
import { AppBar } from 'material-ui';
import { Layer, Stage } from 'react-konva';

interface PlayingScreenProps {
  // pieces: Piece[];
  matchesList: MatchInfo[];
  gameSpecs: GameSpecs;
  match: {
    params: {
      matchId: string;
    };
  };
  myUserId: string;
}

class PlayingScreen extends React.Component<PlayingScreenProps, {}> {
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  constructor(props: PlayingScreenProps) {
    super(props);
    for (let i = 0; i < this.props.matchesList.length; i++) {
      if (
        this.props.match.params.matchId === this.props.matchesList[i].matchId
      ) {
        this.matchInfo = this.props.matchesList[i];
        this.gameSpec = this.props.gameSpecs.gameSpecIdToGameSpec[
          this.matchInfo.gameSpecId
        ];
      }
    }
  }
  render() {
    if (!this.matchInfo) {
      return <div>The matchId doesn't exist.</div>;
    } else if (!this.gameSpec) {
      let gameSpecScreenShot = this.matchInfo.game.screenShot.downloadURL;
      let width = this.matchInfo.game.screenShot.width;
      let height = this.matchInfo.game.screenShot.height;
      let screenShotLayer = (
        <CanvasImage height={height} width={width} src={gameSpecScreenShot} />
      );
      return (
        <>
          <AppBar
            showMenuIconButton={false}
            title={
              <span>Match: {this.matchInfo.game.gameName} (No game spec)</span>
            }
          />
          <Stage width={width} height={height}>
            <Layer ref={() => 'screenShotLayer'}>{screenShotLayer}</Layer>
          </Stage>
        </>
      );
    }

    return (
      <div>
        <Board matchInfo={this.matchInfo} gameSpec={this.gameSpec} />
        <VideoArea />
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  return {
    matchesList: state.matchesList,
    gameSpecs: state.gameSpecs,
    myUserId: state.myUser.myUserId
  };
};

const mapDispatchToProps = () => ({});
export default connect(mapStateToProps, mapDispatchToProps)(PlayingScreen);
