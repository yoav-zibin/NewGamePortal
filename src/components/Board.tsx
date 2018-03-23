import * as React from 'react';
import { Layer, Stage } from 'react-konva';
import { MatchInfo, GameSpec, Piece } from '../types';
import CanvasImage from './CanvasImage';
import BoardPiece from './BoardPiece';
import { AppBar, FlatButton } from 'material-ui';
// import { MatchStateHelper } from '../services/matchStateHelper'

interface Props {
  pieces: Piece[];
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  myUserId: string;
  onReset: () => void;
}

// for testing purposes
const testProps: Props = {
  pieces: [],
  matchInfo: {
    matchId: '123',
    gameSpecId: 'test',
    game: {
      gameSpecId: 'test',
      gameName: 'Chess',
      screenShot: {
        imageId: '',
        width: 100,
        height: 100,
        isBoardImage: false,
        downloadURL:
          'https://firebasestorage.googleapis.com/v0/b/universalgamemaker.appspot.com/o/images' +
          '%2F-KtRrhplWWiDZXECJ_FO.jpg?alt=media&token=6808e2bb-cb5c-48ec-ae15-4a5d3e9a2b29'
      }
    },
    participantsUserIds: ['test user'],
    lastUpdatedOn: 0,
    matchState: []
  },
  gameSpec: {
    board: {
      imageId: '',
      width: 100,
      height: 100,
      isBoardImage: true,
      downloadURL:
        'https://firebasestorage.googleapis.com/v0/b/universalgamemaker.appspot.com/o/images' +
        '%2F-KtRrhplWWiDZXECJ_FO.jpg?alt=media&token=6808e2bb-cb5c-48ec-ae15-4a5d3e9a2b29'
    },
    gameSpecId: 'test',
    pieces: []
  },
  myUserId: 'test user',
  onReset: () => {
    console.log('Reset Pressed');
  }
};
// const matchDispatchToPropsForBoard = (dispatch) => {
//     return {
//         handleChange: (key) => {
//             action : Action = {};
//             const newMatchStateHelper: MatchStateHelper = {};
//             // get pieces state like pieceIndex: number, x: number, y: number using key
//             newMatchStateHelper.dragTo(1,1,1);
//             //dispatch new state of pieces
//             // dispatch();
//             newMatchStateHelper.resetMatch();
//             dispatch(action);
//         }
//     }
// };
// onChange={() => {this.props.handleChange(this.props.key)}}

/**
 * A reusable board class, that given a board image and pieces in props
 * can draw the board and piece on top of it using konva.
 * Should also add drag and drop functionality later on.
 */
const Board = (props: Props) => {
  let width = 600;
  let height = 600;

  props = {
    ...props,
    ...testProps
  };

  // TODO: Complete layer for board
  let boardImage = props.gameSpec.board.downloadURL;
  let boardLayer = (
    <CanvasImage height={height} width={width} src={boardImage} />
  );

  // TODO: Complete layer for pieces
  let piecesLayer = props.matchInfo.matchState.map((piece, i) => {
    let pieceSpec = props.gameSpec.pieces[piece.currentImageIndex];
    return (
      <BoardPiece
        key={'piece' + i}
        height={pieceSpec.element.height * height / props.gameSpec.board.height}
        width={pieceSpec.element.width * width / props.gameSpec.board.height}
        x={piece.x * width / 100}
        y={piece.y * height / 100}
        src={'placeholder'}
        element={pieceSpec.element}
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
};

export default Board;
