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

  //   componentDidMount() {
  //       const matchId = this.props.matchInfo.matchId;
  //       ourFirebase.listenToMatch(matchId);
  //       ourFirebase.addMatchMembership(this.props.myUserId, '-L8JTrbrFT46x-PcQ5EY');
  //   }

  // cycles through the images of each piece
  togglePiece(index: number) {
    const match: MatchInfo = this.props.matchInfo;
    const helper: MatchStateHelper = new MatchStateHelper(match);
    helper.toggleImage(index);
    ourFirebase.updatePieceState(match, index);
    console.log('toggle Piece index:', index);
  }

  rotatePiece(index: number) {
    // TODO:
    console.log('Rotate Piece index:', index);
  }

  rollDice(index: number) {
    console.log('Roll Dice for index:', index);
    const match: MatchInfo = this.props.matchInfo;
    const helper: MatchStateHelper = new MatchStateHelper(match);
    helper.rollDice(index);
    ourFirebase.updatePieceState(match, index);
  }

  handleCardClick(index: number) {
    // const prop = this.props;
    // if (prop.matchInfo.matchState[index].cardVisibilityPerIndex[prop.myUserId]) {
    //     prop.matchInfo.matchState[index].currentImageIndex = 1;
    // } else {
    //     prop.matchInfo.matchState[index].currentImageIndex = 0;
    // }
    console.log('Handle Card right Click for index:', index);
  }

  handleDragEnd = (index: number) => {
    console.log('handleragEnd' + index);

    let position = (this.refs[
      'canvasImage' + index
    ] as CanvasImage).imageNode.getAbsolutePosition();
    console.log(position);

    let width = this.props.gameSpec.board.width;
    let height = this.props.gameSpec.board.height;
    let x = position.x / width * 100;
    let y = position.y / height * 100;
    console.log(x, y);

    const match: MatchInfo = this.props.matchInfo;
    const helper: MatchStateHelper = new MatchStateHelper(match);
    helper.dragTo(index, x, y);
    ourFirebase.updatePieceState(match, index);
  };

  render() {
    const props = this.props;
    if (!props.gameSpec) {
      return <div>No game spec</div>;
    }

    // TODO: Complete layer for board
    let boardImage = props.gameSpec.board.downloadURL;
    let width = props.gameSpec.board.width;
    let height = props.gameSpec.board.height;
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
          onContextMenu={() => {
            console.log('Piece right clicked!');
            if (kind === 'card') {
              this.handleCardClick(index);
            }
          }}
          onClick={() => {
            console.log('Piece left clicked!');
            if (kind === 'toggable') {
              this.togglePiece(index);
            } else if (kind === 'dice') {
              this.rollDice(index);
            } else if (kind === 'card') {
              // this.handleCardClick(index);
            }
          }}
          //   onMouseOver={() => {
          //     // this.props.hideCardOptions();
          //     // if (piece.kind === 'card') {
          //     //   this.showCardVisibility(index);
          //     // }
          //     console.log('Mouse over');
          //   }}
          //   onMouseOut={() => {
          //     // if (piece.kind === 'card') {
          //     //   this.hideCardVisibility();
          //     // }
          //     console.log('Mouse out!');
          //   }}
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
            this.handleDragEnd(index);
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
