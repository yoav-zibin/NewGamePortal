import * as React from 'react';
import { Layer, Stage } from 'react-konva';
import { MatchInfo, GameSpec, Piece } from '../types';
import CanvasImage from './CanvasImage';
// import BoardPiece from './BoardPiece';
import { AppBar, FlatButton } from 'material-ui';
import { ourFirebase } from '../services/firebase';
import { store, dispatch } from '../stores';
import { MatchStateHelper } from '../services/matchStateHelper';
import { connect, Dispatch } from 'react-redux';
import { StoreState } from '../types/index';
import { Action } from '../reducers';

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

  componentDidMount() {
    // TODO: delete once we have phone-number login.
    ourFirebase.allPromisesForTests = [];
    ourFirebase.init();
    ourFirebase.signInAnonymously().then(() => {
      console.warn('Signed in anonymously, userId=', ourFirebase.getUserId());
      Promise.all(ourFirebase.allPromisesForTests!).then(() => {
        const gameInfo = store
          .getState()
          .gamesList.find(gameInList => gameInList.gameName === 'Chess')!;
        ourFirebase.fetchGameSpec(gameInfo);
        Promise.all(ourFirebase.allPromisesForTests!).then(() => {
          if (store.getState().matchesList.length === 0) {
            const gameSpec = store.getState().gameSpecs.gameSpecIdToGameSpec[
              gameInfo.gameSpecId
            ];
            const initialState = MatchStateHelper.createInitialState(gameSpec);
            ourFirebase.createMatch(gameInfo, initialState);
          }
          dispatch({ setCurrentMatchIndex: 0 });
        });
      });
    });
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
    // let piecesLayer = props.matchInfo.matchState.map((piece, i) => {
    //   let pieceSpec = props.gameSpec.pieces[piece.currentImageIndex];
    //   return (
    //     <BoardPiece
    //       key={'piece' + i}
    //       height={pieceSpec.element.height * height / props.gameSpec.board.height}
    //       width={pieceSpec.element.width * width / props.gameSpec.board.height}
    //       x={piece.x * width / 100}
    //       y={piece.y * height / 100}
    //       src={'placeholder'}
    //       element={pieceSpec.element}
    //     />
    //   );
    // });

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
            {/* <Layer ref={() => 'piecesLayer'}>{piecesLayer}</Layer> */}
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
const mapDispatchToProps = (d: Dispatch<any>) => ({
  onReset: () => {
    const action: Action = {
      resetMatch: null
    };
    d({ type: action });
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Board);
