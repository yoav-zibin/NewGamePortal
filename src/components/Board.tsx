import * as React from 'react';
import { Layer, Stage } from 'react-konva';
import { MatchInfo, GameSpecs, GameSpec } from '../types';
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
  matchesList: MatchInfo[];
  gameSpecs: GameSpecs;
  match: {
    params: {
      matchId: string;
    };
  };
}

interface BoardState {
  showCardOptions: boolean;
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
  // TODO MAYBE REMOVE?
  participantNames: string[];
  tooltipPosition: {
    x: number;
    y: number;
  };
  matchInfo: MatchInfo;
  gameSpec: GameSpec;
  helper: MatchStateHelper;
  // TODO change to function
  isDeck: boolean[];

  constructor(props: BoardProps) {
    super(props);
    this.state = {
      showCardOptions: false
    };
    this.tooltipPosition = {
      x: 0,
      y: 0
    };
    // TODO change to new for loop
    for (let i = 0; i < this.props.matchesList.length; i++) {
      if (
        this.props.match.params.matchId === this.props.matchesList[i].matchId
      ) {
        this.matchInfo = this.props.matchesList[i];
        this.gameSpec = this.props.gameSpecs.gameSpecIdToGameSpec[
          this.matchInfo.gameSpecId
        ];

        if (this.gameSpec) {
          this.helper = new MatchStateHelper(this.matchInfo);
        }
      }
    }
    this.participantNames = this.matchInfo.participantsUserIds;
    this.selfParticipantIndex = this.participantNames.indexOf(
      this.props.myUserId
    );
    let isDeckTemp: boolean[] = [];
    for (let i = 0; i < this.gameSpec.pieces.length; i++) {
      if (this.gameSpec.pieces[i].deckPieceIndex === -1) {
        isDeckTemp[i] = false;
      } else {
        isDeckTemp[i] = true;
      }
    }
    this.isDeck = isDeckTemp;
  }

  // TODO move this all to PlayingScreen
  componentDidUpdate() {
    for (let i = 0; i < this.props.matchesList.length; i++) {
      if (
        this.props.match.params.matchId === this.props.matchesList[i].matchId
      ) {
        this.matchInfo = this.props.matchesList[i];
        this.gameSpec = this.props.gameSpecs.gameSpecIdToGameSpec[
          this.matchInfo.gameSpecId
        ];
        this.helper = new MatchStateHelper(this.matchInfo);
      }
    }
    this.participantNames = this.matchInfo.participantsUserIds;
    this.selfParticipantIndex = this.participantNames.indexOf(
      this.props.myUserId
    );
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

    let width = this.gameSpec.board.width;
    let height = this.gameSpec.board.height;
    let x = position.x / width * 100;
    let y = position.y / height * 100;

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

  render() {
    if (!this.gameSpec) {
      let gameSpecScreenShot = this.matchInfo.game.screenShot.downloadURL;
      let screenShotWidth = this.matchInfo.game.screenShot.width;
      let screenShotHeight = this.matchInfo.game.screenShot.height;
      let screenShotLayer = (
        <CanvasImage
          height={screenShotHeight}
          width={screenShotWidth}
          src={gameSpecScreenShot}
        />
      );
      // TODO show a spinner over the screenshot
      return (
        <>
          {/* <AppBar
            showMenuIconButton={false}
            title={
              <span>Match: {this.matchInfo.game.gameName} (No game spec)</span>
            }
          /> */}
          <div>The Gamespec has not been loaded.</div>
          <Stage width={screenShotWidth} height={screenShotHeight}>
            <Layer ref={() => 'screenShotLayer'}>{screenShotLayer}</Layer>
          </Stage>
        </>
      );
    }
    // TODO: Complete layer for board
    let boardImage = this.gameSpec.board.downloadURL;
    // TODO: handle resizing so everything fits in the screen
    let width = this.gameSpec.board.width;
    let height = this.gameSpec.board.height;
    let boardLayer = (
      <CanvasImage
        height={height}
        width={width}
        src={boardImage}
        onClick={() => this.hideCardOptions()}
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
          height={
            pieceSpec.element.height * height / this.gameSpec.board.height
          }
          width={pieceSpec.element.width * width / this.gameSpec.board.width}
          x={piece.x * width / 100}
          y={piece.y * height / 100}
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
        />
        <MenuItem
          style={{ padding: '0', listStyle: 'none', margin: '0' }}
          primaryText={'Make Visible To Everyone'}
          onClick={() => {
            this.makeCardVisibleToAll(this.selectedPieceIndex);
          }}
        />
        <MenuItem
          style={{ padding: '0', listStyle: 'none', margin: '0' }}
          primaryText={'Hide From Everyone'}
          onClick={() => {
            this.makeCardHiddenToAll(this.selectedPieceIndex);
          }}
        />
        {this.isDeck[this.selectedPieceIndex] ? (
          <MenuItem
            style={{ padding: '0', listStyle: 'none', margin: '0' }}
            primaryText={'Shuffle Deck'}
            onClick={() => {
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
        <Stage width={width} height={height}>
          <Layer ref={() => 'boardLayer'}>{boardLayer}</Layer>
          <Layer ref={() => 'piecesLayer'}>{piecesLayer}</Layer>
        </Stage>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  return {
    myUserId: state.myUser.myUserId,
    matchesList: state.matchesList,
    gameSpecs: state.gameSpecs
  };
};

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Board);
