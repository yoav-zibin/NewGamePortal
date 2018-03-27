import * as React from 'react';
import { Layer, Stage } from 'react-konva';
import { MatchInfo, GameSpec, Piece } from '../types';
import CanvasImage from './CanvasImage';
import { AppBar, FlatButton } from 'material-ui';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { ourFirebase } from '../services/firebase';
import { MatchStateHelper } from '../services/matchStateHelper';

interface BoardProps {
  pieces: Piece[];
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  myUserId: string;
}

/**
 * A reusable board class, that given a board image and pieces in props
 * can draw the board and piece on top of it using konva.
 * Should also add drag and drop functionality later on.
 */
class Board extends React.Component<BoardProps, {}> {
  constructor(props: BoardProps) {
    super(props);
  }

  // cycles through the images of each piece
  togglePiece(index: number) {
    this.props.pieces[index].deckPieceIndex += 1;
    this.props.pieces[index].deckPieceIndex %= this.props.pieces[
      index
    ].element.images.length;
    ourFirebase.updateMatchState(this.props.matchInfo);
  }

  rotatePiece(index: number) {
    // TODO:
    console.log('Rotate Piece index:', index);
  }

  rollDice(index: number) {
    // TODO:
    console.log('Roll Dice for index:', index);
  }

  handleCardClick(index: number) {
    // TODO:
    console.log('Handle Card Click for index:', index);
  }

  render() {
    const props = this.props;
    if (!props.gameSpec) {
      return <div>No game spec</div>;
    }
    let width = 600;
    let height = 600;

    // TODO: Complete layer for board
    let boardImage = props.gameSpec.board.downloadURL;
    let boardLayer = (
      <CanvasImage height={height} width={width} src={boardImage} />
    );

    // // TODO: Complete layer for pieces
    let piecesLayer = props.matchInfo.matchState.map((piece, index) => {
      const pieceSpec = props.gameSpec.pieces[index];
      let kind = pieceSpec.element.elementKind;
      return (
        <CanvasImage
          ref={'canvasImage' + index}
          key={index}
          draggable={pieceSpec.element.isDraggable || kind === 'standard'}
          onClick={() => {
            console.log('Piece clicked!');
            if (kind === 'standard') {
              this.rotatePiece(index);
            } else if (kind === 'toggable') {
              console.log('here');
              this.togglePiece(index);
            } else if (kind === 'dice') {
              this.rollDice(index);
            } else if (kind === 'card') {
              this.handleCardClick(index);
            }
          }}
          onMouseOver={() => {
            // this.props.hideCardOptions();
            // if (piece.kind === 'card') {
            //   this.showCardVisibility(index);
            // }
            console.log('Mouse over');
          }}
          onMouseOut={() => {
            // if (piece.kind === 'card') {
            //   this.hideCardVisibility();
            // }
            console.log('Mouse out!');
          }}
          height={
            pieceSpec.element.height * height / this.props.gameSpec.board.height
          }
          width={
            pieceSpec.element.width * width / this.props.gameSpec.board.width
          }
          x={piece.x * width / 100}
          y={piece.y * height / 100}
          src={pieceSpec.element.images[piece.currentImageIndex].downloadURL}
          onDragStart={() => {
            // if (piece.kind === 'card') {
            //   thiz.hideCardVisibility();
            //   thiz.props.hideCardOptions();
            // }
            // thiz.handleDragStart(index);
            console.log('Drag Start');
          }}
          onDragEnd={() => {
            // if (piece.kind === 'card') {
            //   thiz.showCardVisibility(index);
            // }
            // thiz.handleDragEnd(index)
            console.log('Drag End');
          }}
        />
      );
    });

    return (
      <>
        <AppBar
          showMenuIconButton={false}
          iconElementRight={
            <FlatButton
              label="Reset"
              onClick={e => {
                e.preventDefault();
                const helper = new MatchStateHelper(props.matchInfo);
                helper.resetMatch();
                ourFirebase.updateMatchState(props.matchInfo);
              }}
            />
          }
          title={<span>Match: {props.matchInfo.game.gameName}</span>}
        />
        <div ref={() => 'parentContainer'}>
          <Stage width={width} height={height}>
            <Layer ref={() => 'boardLayer'}>{boardLayer}</Layer>
            <Layer ref={() => 'piecesLayer'}>{piecesLayer}</Layer>
          </Stage>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  if (state.currentMatchIndex === -1) {
    return {};
  }
  return {
    pieces:
      state.gameSpecs.gameSpecIdToGameSpec[
        state.matchesList[state.currentMatchIndex].game.gameSpecId
      ].pieces,
    matchInfo: state.matchesList[state.currentMatchIndex],
    gameSpec:
      state.gameSpecs.gameSpecIdToGameSpec[
        state.matchesList[state.currentMatchIndex].game.gameSpecId
      ],
    myUserId: state.myUser.myUserId
  };
};

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Board);
