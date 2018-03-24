import * as React from 'react';
import { Layer, Stage } from 'react-konva';
import { MatchInfo, GameSpec, Piece } from '../types';
import CanvasImage from './CanvasImage';
import { AppBar, FlatButton } from 'material-ui';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

interface BoardProps {
  pieces: Piece[];
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  myUserId: string;
  onReset: () => void;
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
      let pieceSpec = props.gameSpec.pieces[piece.currentImageIndex];
      let kind = pieceSpec.element.elementKind;
      return (
        <CanvasImage
          ref={'canvasImage' + index}
          key={index}
          draggable={pieceSpec.element.isDraggable || kind === 'standard'}
          onClick={() => {
            console.log('Piece clicked!');
            // if (kind === 'standard') {
            //   this.rotatePiece('canvasImage' + index, index, piece);
            // } else if (piece.kind === 'toggable') {
            //   this.togglePiece('canvasImage' + index, index, piece);
            // } else if (piece.kind === 'dice') {
            //   this.rollDice('canvasImage' + index, index, piece);
            // } else if (piece.kind === 'card') {
            //   this.handleCardClick('canvasImage' + index, index, piece);
            // }
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

    console.log('Pieces Layer:', piecesLayer);
    return (
      <>
        <AppBar
          showMenuIconButton={false}
          iconElementRight={
            <FlatButton
              label="Reset"
              onClick={e => {
                e.preventDefault();
                props.onReset();
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
const mapDispatchToProps = () => ({
  onReset: () => {
    // TODO ourFirebase.updateMatchState();
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Board);
