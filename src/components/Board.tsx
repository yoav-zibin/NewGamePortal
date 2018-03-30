import * as React from 'react';
import { Layer, Stage } from 'react-konva';
import {
  MatchInfo,
  GameSpecs,
  GameSpec,
  Piece,
  CardVisibility
} from '../types';
import CanvasImage from './CanvasImage';
import {
  AppBar,
  FlatButton,
  IconButton,
  IconMenu,
  MenuItem
} from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { ourFirebase } from '../services/firebase';
import { MatchStateHelper } from '../services/matchStateHelper';

interface BoardProps {
  matchesList: MatchInfo[];
  gameSpecs: GameSpecs;
  myUserId: string;
  match: {
    params: {
      matchId: string;
    };
  };
}

interface BoardState {
  showCardOptions: boolean;
  showTooltip: boolean;
}

/**
 * A reusable board class, that given a board image and pieces in props
 * can draw the board and piece on top of it using konva.
 * Should also add drag and drop functionality later on.
 */
class Board extends React.Component<BoardProps, BoardState> {
  selectedPieceIndex: number;
  selfParticipantIndex: number;
  participantNames: string[];
  deckIndex: number;
  tooltipPosition: {
    x: number;
    y: number;
  };
  visibleTo: CardVisibility;
  matchInfo: MatchInfo;
  pieces: Piece[];
  gameSpec: GameSpec;

  constructor(props: BoardProps) {
    super(props);
    this.state = {
      showCardOptions: false,
      showTooltip: false
    };
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

  //   componentDidMount() {
  //       const matchId = this.props.matchInfo.matchId;
  //       ourFirebase.listenToMatch(matchId);
  //       ourFirebase.addMatchMembership(this.props.myUserId, '-L8JTrbrFT46x-PcQ5EY');
  //   }

  // cycles through the images of each piece
  togglePiece(index: number) {
    const match: MatchInfo = this.matchInfo;
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
    const match: MatchInfo = this.matchInfo;
    const helper: MatchStateHelper = new MatchStateHelper(match);
    helper.rollDice(index);
    ourFirebase.updatePieceState(match, index);
  }

  shuffleDeck(index: number) {
    // TODO:
    console.log('Shufle Deck for index:', index);
  }

  handleCardClick(index: number) {
    const prop = this.props;
    if (
      this.matchInfo.matchState[index].cardVisibilityPerIndex[prop.myUserId]
    ) {
      this.matchInfo.matchState[index].currentImageIndex = 1;
    } else {
      this.matchInfo.matchState[index].currentImageIndex = 0;
    }
    console.log('Handle Card right Click for index:', index);
  }

  handleDragEnd = (index: number) => {
    console.log('handleragEnd' + index);

    let position = (this.refs[
      'canvasImage' + index
    ] as CanvasImage).imageNode.getAbsolutePosition();
    console.log(position);

    let width = this.gameSpec.board.width;
    let height = this.gameSpec.board.height;
    let x = position.x / width * 100;
    let y = position.y / height * 100;
    console.log(x, y);

    const match: MatchInfo = this.matchInfo;
    const helper: MatchStateHelper = new MatchStateHelper(match);
    helper.dragTo(index, x, y);
    ourFirebase.updatePieceState(match, index);
  };

  makeCardVisibleToSelf() {
    // TODO:
  }

  makeCardVisibleToAll() {
    // TODO:
  }

  makeCardHiddenToAll() {
    // TODO:
  }

  toggleTooltip(refString: string | null, index: number | null) {
    if (refString === null || index === null) {
      this.selectedPieceIndex = -1;
      this.setState({ showTooltip: false });
      return;
    } else if (this.selectedPieceIndex === index) {
      this.selectedPieceIndex = -1;
      this.setState({ showTooltip: false });
      return;
    }

    this.selectedPieceIndex = index;
    let position = (this.refs[
      refString
    ] as CanvasImage).imageNode.getAbsolutePosition();
    this.visibleTo = this.matchInfo.matchState[index].cardVisibilityPerIndex;
    this.tooltipPosition = {
      x: position.x,
      y: position.y
    };
    this.setState({ showTooltip: true });
  }

  displayCardOptions(
    cardIndex: number,
    selfParticipantIndex: number,
    participantNames: string[],
    deckIndex: number
  ) {
    this.selectedPieceIndex = cardIndex;
    this.selfParticipantIndex = selfParticipantIndex;
    this.participantNames = participantNames;
    this.deckIndex = deckIndex;
    this.setState({
      showTooltip: false,
      showCardOptions: true
    });
  }

  hideCardOptions() {
    this.setState({
      showCardOptions: false
    });
  }

  render() {
    if (!this.gameSpec) {
      return <div>No game spec</div>;
    }

    // TODO: Complete layer for board
    let boardImage = this.gameSpec.board.downloadURL;
    let width = this.gameSpec.board.width;
    let height = this.gameSpec.board.height;
    let boardLayer = (
      <CanvasImage
        height={height}
        width={width}
        src={boardImage}
        onClick={() => this.toggleTooltip(null, null)}
      />
    );

    // // TODO: Complete layer for pieces
    let piecesLayer = this.matchInfo.matchState.map((piece, index) => {
      const pieceSpec = this.gameSpec.pieces[index];
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
            this.toggleTooltip('canvasImage' + index, index);
          }}
          height={
            pieceSpec.element.height * height / this.gameSpec.board.height
          }
          width={pieceSpec.element.width * width / this.gameSpec.board.width}
          x={piece.x * width / 100}
          y={piece.y * height / 100}
          src={pieceSpec.element.images[piece.currentImageIndex].downloadURL}
          onDragStart={() => {
            this.toggleTooltip(null, null);
          }}
          onDragEnd={() => {
            this.handleDragEnd(index);
          }}
        />
      );
    });

    let toolTipLayer = (
      <>
        {this.state.showTooltip ? (
          <IconMenu
            iconButtonElement={
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            }
            anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
            targetOrigin={{ horizontal: 'left', vertical: 'top' }}
            className="my-tooltip"
            style={{
              left: this.tooltipPosition.x,
              top: this.tooltipPosition.y,
              position: 'absolute',
              zIndex: 100
            }}
          >
            {Object.keys(this.visibleTo).length === 0 ? (
              <MenuItem primaryText="Not a card." />
            ) : null}
            {Object.keys(this.visibleTo).map((name, index) => {
              return (
                <MenuItem
                  key={'tooltip' + index}
                  style={{ padding: '0', listStyle: 'none', margin: '0' }}
                  primaryText={name}
                />
              );
            })}
          </IconMenu>
        ) : null}
        {this.state.showCardOptions ? (
          <div
            className="my-card-options"
            style={{
              left: this.tooltipPosition.x,
              top: this.tooltipPosition.y
            }}
          >
            <div
              className="close-card-options"
              onClick={() => {
                this.hideCardOptions();
              }}
            >
              x
            </div>
            <span style={{ textDecoration: 'underline', textAlign: 'center' }}>
              OPTIONS:
            </span>
            <ul style={{ padding: '0', listStyle: 'none', margin: '0' }}>
              <li
                className="card-options-item"
                onClick={() => {
                  this.makeCardVisibleToSelf();
                }}
              >
                Make Visible To me
              </li>
              <li
                className="card-options-item"
                onClick={() => {
                  this.makeCardVisibleToAll();
                }}
              >
                Make Visible To Everyone
              </li>
              <li
                className="card-options-item"
                onClick={() => {
                  this.makeCardHiddenToAll();
                }}
              >
                Hide From Everyone
              </li>
              <li
                className="card-options-item"
                onClick={() => {
                  this.shuffleDeck(this.deckIndex);
                }}
              >
                Shuffle Deck
              </li>
            </ul>
          </div>
        ) : null}
      </>
    );

    return (
      <>
        <AppBar
          showMenuIconButton={false}
          iconElementRight={
            <FlatButton
              label="Reset"
              onClick={e => {
                e.preventDefault();
                const helper = new MatchStateHelper(this.matchInfo);
                helper.resetMatch();
                ourFirebase.updateMatchState(this.matchInfo);
              }}
            />
          }
          title={<span>Match: {this.matchInfo.game.gameName}</span>}
        />
        <div style={{ position: 'relative' }}>
          {toolTipLayer}
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
  return {
    gameSpecs: state.gameSpecs,
    matchesList: state.matchesList,
    myUserId: state.myUser.myUserId
  };
};

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Board);
