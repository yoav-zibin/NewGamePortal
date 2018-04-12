import * as React from 'react';
import { Layer, Stage } from 'react-konva';
import { MatchInfo, GameSpec } from '../types';
import CanvasImage from './CanvasImage';
import {
  // AppBar,
  // FlatButton,
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
  myUserId: string;
  gameSpec: GameSpec;
  matchInfo: MatchInfo;
}

interface BoardState {
  showCardOptions: boolean;
  innerWidth: number;
  innerHeight: number;
}

/**
 * A reusable board class, that given a board image and pieces in props
 * can draw the board and piece on top of it using konva.
 * Should also add drag and drop functionality later on.
 */
class Board extends React.Component<BoardProps, BoardState> {
  // TODO CARD
  selectedPieceIndex: number;
  selfParticipantIndex: number;
  tooltipPosition: {
    x: number;
    y: number;
  };
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  helper: MatchStateHelper;
  throttled: boolean;
  delay: number;

  constructor(props: BoardProps) {
    super(props);
    this.state = {
      showCardOptions: false,
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth
    };
    this.tooltipPosition = {
      x: 0,
      y: 0
    };

    this.matchInfo = this.props.matchInfo;
    this.gameSpec = this.props.gameSpec;
    this.selfParticipantIndex = this.matchInfo.participantsUserIds.indexOf(
      this.props.myUserId
    );
    this.helper = new MatchStateHelper(this.matchInfo);

    // for throttling window resize event
    this.throttled = false;
  }

  // resize the board (also for correctly displaying on mobile)
  componentDidMount() {
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    if (!this.throttled) {
      this.getDimensions();
      this.throttled = true;
      setTimeout(() => (this.throttled = false), 250);
    }
  }

  getDimensions() {
    this.setState({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    });
  }

  // check if a card belongs to a deck
  isDeck(index: number | undefined) {
    if (index === undefined) {
      return false;
    }
    if (this.gameSpec.pieces[index].deckPieceIndex === -1) {
      return false;
    } else {
      return true;
    }
  }

  // cycles through the images of each piece
  togglePiece(index: number) {
    const match: MatchInfo = this.matchInfo;
    this.helper.toggleImage(index);
    ourFirebase.updatePieceState(match, index);
    console.log('toggle Piece index:', index);
  }

  rollDice(index: number) {
    console.log('Roll Dice for index:', index);
    const match: MatchInfo = this.matchInfo;
    this.helper.rollDice(index);
    ourFirebase.updatePieceState(match, index);
  }

  shuffleDeck(index: number) {
    const match: MatchInfo = this.matchInfo;
    this.helper.shuffleDeck(index);
    ourFirebase.updateMatchState(match);
    console.log('Shufle Deck for index:', index);
  }

  handleDragEnd = (index: number) => {
    console.log('handleDragEnd' + index);

    let position = (this.refs[
      'canvasImage' + index
    ] as CanvasImage).imageNode.getAbsolutePosition();

    const width = this.gameSpec.board.width;
    const height = this.gameSpec.board.height;
    const ratio = Math.min(
      this.state.innerWidth / width,
      this.state.innerHeight / height
    );

    const x = position.x / ratio / width * 100;
    const y = position.y / ratio / height * 100;

    console.log(x, y);
    const match: MatchInfo = this.matchInfo;
    this.helper.dragTo(index, x, y);
    ourFirebase.updatePieceState(match, index);
  };

  makeCardVisibleToSelf(index: number) {
    const match: MatchInfo = this.matchInfo;
    this.helper.showMe(index);
    ourFirebase.updatePieceState(match, index);
    console.log('card show to me:', index);
  }

  makeCardVisibleToAll(index: number) {
    const match: MatchInfo = this.matchInfo;
    this.helper.showEveryone(index);
    ourFirebase.updatePieceState(match, index);
    console.log('card show to everyone:', index);
  }

  makeCardHiddenToAll(index: number) {
    const match: MatchInfo = this.matchInfo;
    this.helper.hideFromEveryone(index);
    ourFirebase.updatePieceState(match, index);
    console.log('card hide to everyone:', index);
  }

  toggleCardOptions(refString: string, cardIndex: number) {
    if (this.selectedPieceIndex === cardIndex) {
      // if we click on an already selected piece, hide the tooltip
      this.hideCardOptions();
    } else {
      this.selectedPieceIndex = cardIndex;
      let position = (this.refs[
        refString
      ] as CanvasImage).imageNode.getAbsolutePosition();
      this.tooltipPosition = {
        x: position.x,
        y: position.y
      };
      this.setState({
        showCardOptions: true
      });
    }
  }

  hideCardOptions() {
    this.selectedPieceIndex = -1;
    this.setState({
      showCardOptions: false
    });
  }

  // TODO: the UI should show cards that are visible to you always at higher z-indices than
  // cards that aren't visible to you, i.e., have two layers for pieces: one that
  // is for cards that aren't visible to you and one for everything else.
  // E.g., suppose that card A isn't visible to you and it has zDepth=10, and card B
  // that is visible to you with zDepth=9, and they are both with the same x & y.
  // If there is just one layer for pieces, then if you drag the card from that x&y then it would drag the piece with
  // the highest zDepth (so card A).
  // But if we use two layers for pieces, then card A will be in one layer and card B
  // in another layer (that is above the first layer), so dragging will correctly pick card B.

  render() {
    // TODO: Complete layer for board
    let boardImage = this.gameSpec.board.downloadURL;
    // TODO: handle resizing so everything fits in the screen
    const width = this.gameSpec.board.width;
    const height = this.gameSpec.board.height;
    const ratio = Math.min(
      this.state.innerWidth / width,
      this.state.innerHeight / height
    );

    let boardLayer = (
      <CanvasImage
        height={height * ratio}
        width={width * ratio}
        src={boardImage}
        onClick={() => this.hideCardOptions()}
        onTouchStart={() => this.hideCardOptions()}
      />
    );

    if (this.matchInfo.matchState.length === 0) {
      this.matchInfo.matchState = MatchStateHelper.createInitialState(
        this.gameSpec
      );
      ourFirebase.updateMatchState(this.matchInfo);
    }

    // // TODO: Complete layer for pieces
    let piecesLayer = this.matchInfo.matchState.map((piece, index) => {
      const pieceSpec = this.gameSpec.pieces[index];
      let kind = pieceSpec.element.elementKind;
      let isVisible = piece.cardVisibilityPerIndex[this.selfParticipantIndex];
      let imageSrc: string = '';
      if (pieceSpec.element.elementKind === 'card') {
        if (isVisible) {
          imageSrc = pieceSpec.element.images[0].downloadURL;
        } else {
          imageSrc = pieceSpec.element.images[1].downloadURL;
        }
      } else {
        imageSrc =
          pieceSpec.element.images[piece.currentImageIndex].downloadURL;
      }
      return (
        <CanvasImage
          ref={'canvasImage' + index}
          key={index}
          draggable={pieceSpec.element.isDraggable || kind === 'standard'}
          onClick={() => {
            if (kind === 'toggable') {
              this.togglePiece(index);
            } else if (kind === 'dice') {
              this.rollDice(index);
            } else if (kind === 'card') {
              this.toggleCardOptions('canvasImage' + index, index);
            }
          }}
          onTouchStart={() => {
            if (kind === 'toggable') {
              this.togglePiece(index);
            } else if (kind === 'dice') {
              this.rollDice(index);
            } else if (kind === 'card') {
              this.toggleCardOptions('canvasImage' + index, index);
            }
          }}
          height={pieceSpec.element.height * ratio}
          width={pieceSpec.element.width * ratio}
          x={piece.x * width / 100 * ratio}
          y={piece.y * height / 100 * ratio}
          src={imageSrc}
          onDragStart={() => {
            this.hideCardOptions();
          }}
          onDragEnd={() => {
            this.handleDragEnd(index);
          }}
        />
      );
    });

    let toolTipLayer = (
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
          display: this.state.showCardOptions ? 'initial' : 'none',
          zIndex: 100,
          background: 'white',
          width: '40px',
          height: '40px'
        }}
      >
        <MenuItem
          style={{ padding: '0', listStyle: 'none', margin: '0' }}
          primaryText={'Options:'}
          disabled={true}
        />
        <MenuItem
          style={{ padding: '0', listStyle: 'none', margin: '0' }}
          primaryText={'Make Visible To Me'}
          onClick={() => {
            this.makeCardVisibleToSelf(this.selectedPieceIndex);
          }}
          onTouchStart={() => {
            this.makeCardVisibleToSelf(this.selectedPieceIndex);
          }}
        />
        <MenuItem
          style={{ padding: '0', listStyle: 'none', margin: '0' }}
          primaryText={'Make Visible To Everyone'}
          onClick={() => {
            this.makeCardVisibleToAll(this.selectedPieceIndex);
          }}
          onTouchStart={() => {
            this.makeCardVisibleToAll(this.selectedPieceIndex);
          }}
        />
        <MenuItem
          style={{ padding: '0', listStyle: 'none', margin: '0' }}
          primaryText={'Hide From Everyone'}
          onClick={() => {
            this.makeCardHiddenToAll(this.selectedPieceIndex);
          }}
          onTouchStart={() => {
            this.makeCardHiddenToAll(this.selectedPieceIndex);
          }}
        />
        {this.selectedPieceIndex !== -1 &&
        this.isDeck(this.selectedPieceIndex) ? (
          <MenuItem
            style={{ padding: '0', listStyle: 'none', margin: '0' }}
            primaryText={'Shuffle Deck'}
            onClick={() => {
              this.shuffleDeck(
                this.gameSpec.pieces[this.selectedPieceIndex].deckPieceIndex
              );
            }}
            onTouchStart={() => {
              this.shuffleDeck(
                this.gameSpec.pieces[this.selectedPieceIndex].deckPieceIndex
              );
            }}
          />
        ) : null}
      </IconMenu>
    );

    return (
      <div style={{ position: 'relative' }}>
        {toolTipLayer}
        <Stage width={width * ratio} height={height * ratio}>
          <Layer ref={() => 'boardLayer'}>{boardLayer}</Layer>
          <Layer ref={() => 'piecesLayer'}>{piecesLayer}</Layer>
        </Stage>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  return {
    myUserId: state.myUser.myUserId
  };
};
export default connect(mapStateToProps)(Board);
