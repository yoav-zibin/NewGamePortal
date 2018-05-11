import * as React from 'react';
import * as Konva from 'konva';
import { Layer, Stage } from 'react-konva';
import { MatchInfo, GameSpec, PieceState, MatchState, WindowDimensions } from '../types';
import CanvasImage from './CanvasImage';
import { red500 } from 'material-ui/styles/colors';
import Shuffle from 'material-ui/svg-icons/av/shuffle';
import Person from 'material-ui/svg-icons/social/person';
import People from 'material-ui/svg-icons/social/people';
import PeopleOutline from 'material-ui/svg-icons/social/people-outline';

import { IconButton, IconMenu, MenuItem } from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { ourFirebase } from '../services/firebase';
import { MatchStateHelper } from '../services/matchStateHelper';
import { deepCopy, isApp, checkCondition, getBoardRatio } from '../globals';

const dragStartMp3 = require('../sounds/drag-start.mp3');
const diceMp3 = require('../sounds/dice.mp3');
const clickMp3 = require('../sounds/click.mp3');

interface BoardPropsFromState {
  // Passed from store state.
  myUserId: string;
  audioMute: boolean;

  // To ensure the component rerenders when dimensions change.
  windowDimensions: WindowDimensions | undefined;
}
interface BoardProps extends BoardPropsFromState {
  // Passed from PlayingScreen
  gameSpec: GameSpec;
  matchInfo: MatchInfo;
}

interface BoardState {
  selectedPieceIndex: number;
  tooltipPosition: {
    x: number;
    y: number;
  };
  animatingTime: number;
}

let diceAudio = new Audio(diceMp3);
let dragStartAudio = new Audio(dragStartMp3);
let clickAudio = new Audio(clickMp3);

/**
 * A reusable board class, that given a board image and pieces in props
 * can draw the board and piece on top of it using konva.
 * Should also add drag and drop functionality later on.
 */
class Board extends React.Component<BoardProps, BoardState> {
  mutableMatch: MatchInfo = null as any;
  helper: MatchStateHelper = null as any;

  state: BoardState = {
    selectedPieceIndex: -1, // If it's not -1, then we show cards options.
    tooltipPosition: {
      x: 0,
      y: 0
    },
    animatingTime: 0.5
  };

  audioPlaying(sound: HTMLAudioElement) {
    if (isApp && !this.props.audioMute) {
      let playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise
          .then(function() {
            // Automatic playback started!
          })
          .catch(function(error: any) {
            // Automatic playback failed.
            // Show a UI element to let the user manually start playback.
            console.log('fail to play sound', error);
          });
      }
    }
  }

  selfParticipantIndex() {
    return this.props.matchInfo.participantsUserIds.indexOf(this.props.myUserId);
  }

  componentWillUpdate(nextProps: BoardProps) {
    console.log('Board componentWillUpdate');
    const prevMatchState = this.props.matchInfo.matchState;
    if (prevMatchState.length === 0) {
      return;
    }
    const ratio = this.getRatio();
    const nextMatchState = nextProps.matchInfo.matchState;
    let audioToPlay: HTMLAudioElement | null = null;
    for (let i = 0; i < nextMatchState.length; i++) {
      const kind = this.props.gameSpec.pieces[i].element.elementKind;
      if (kind.endsWith('Deck')) {
        continue;
      }
      const imageNode = (this.refs['canvasImage' + i] as CanvasImage).imageNode;
      if (
        prevMatchState[i].x !== nextMatchState[i].x ||
        prevMatchState[i].y !== nextMatchState[i].y
      ) {
        // the position is changed. Call animation.
        imageNode.to({
          duration: this.state.animatingTime,
          x: nextMatchState[i].x / 100 * this.props.gameSpec.board.width * ratio,
          y: nextMatchState[i].y / 100 * this.props.gameSpec.board.height * ratio
        });
        audioToPlay = clickAudio;
      } else if (
        kind === 'card' &&
        prevMatchState[i].cardVisibilityPerIndex[this.selfParticipantIndex()] !==
          nextMatchState[i].cardVisibilityPerIndex[this.selfParticipantIndex()]
      ) {
        // the card is flipped. Call animation.
        this.handleAnimation(i, kind);
        audioToPlay = clickAudio;
      } else if (
        kind === 'toggable' &&
        prevMatchState[i].currentImageIndex !== nextMatchState[i].currentImageIndex
      ) {
        // the piece is toggled. Call animation.
        this.handleAnimation(i, kind);
        audioToPlay = clickAudio;
      } else if (kind === 'dice' && prevMatchState[i].zDepth !== nextMatchState[i].zDepth) {
        // To notify the firebase that someone has rolled a dice
        // (so that other users can see a rolling dice animation)
        // we add the z-depth of dice
        // So if z-depth is changed, that means the dice is rolled. Call animation.
        audioToPlay = diceAudio;
        this.handleAnimation(i, kind);
      }
    }

    if (audioToPlay) {
      this.audioPlaying(audioToPlay);
    }

    this.mutableMatch = deepCopy(nextProps.matchInfo);
  }

  // componentDidUpdate(){
  //   let thiz = this;
  //   for (let i = 0; i < thiz.mutableMatch.matchState.length; i++) {
  //     this.updateZIndex(i, thiz.mutableMatch.matchState[i].zDepth);
  //   }
  // }

  componentWillMount() {
    console.log('Board componentWillMount');
    this.mutableMatch = deepCopy(this.props.matchInfo);
    if (this.mutableMatch.matchState.length === 0) {
      this.mutableMatch.matchState = MatchStateHelper.createInitialState(this.props.gameSpec);
      ourFirebase.updateMatchState(this.mutableMatch);
    }
  }

  handleAnimation(index: number, kind: string) {
    const imageNode = (this.refs['canvasImage' + index] as CanvasImage).imageNode;
    if (kind === 'card') {
      let tween = new Konva.Tween({
        node: imageNode,
        duration: this.state.animatingTime,
        scaleX: 0.001,
        onFinish: function() {
          tween.reverse();
        }
      });
      tween.play();
    } else {
      let tween = new Konva.Tween({
        node: imageNode,
        offsetX: imageNode.width() / 2,
        offsetY: imageNode.height() / 2,
        x: imageNode.x() + imageNode.width() / 2,
        y: imageNode.y() + imageNode.height() / 2,
        duration: this.state.animatingTime,
        rotation: 360,
        onFinish: function() {
          tween.reset();
        }
      });
      tween.play();
    }
  }

  // We need to do that because when we render the component,
  // we want them to be draw in the order of z-index
  sortMatchStateByZ(): { originalIndex: number; pieceState: PieceState }[] {
    const state: MatchState = this.mutableMatch.matchState;
    return state
      .map((pieceState, originalIndex) => ({
        originalIndex,
        pieceState
      }))
      .sort((a, b) => a.pieceState.zDepth - b.pieceState.zDepth);
  }

  // cycles through the images of each piece
  togglePiece(index: number) {
    const match: MatchInfo = this.mutableMatch;
    this.helper.toggleImage(index);
    ourFirebase.updatePieceState(match, index);
    console.log('toggle Piece index:', index);
  }

  rollDice(index: number) {
    console.log('Roll Dice for index:', index);
    const match: MatchInfo = this.mutableMatch;
    this.helper.rollDice(index);
    ourFirebase.updatePieceState(match, index);
  }

  shuffleDeck(deckIndex: number) {
    checkCondition('shuffleDeck', deckIndex >= 0);
    const match: MatchInfo = this.mutableMatch;
    this.helper.shuffleDeck(deckIndex);
    this.hideCardOptions();
    ourFirebase.updateMatchState(match);
    console.log('Shufle Deck for index:');
  }

  updateZIndex = (index: number) => {
    let maxZ = this.helper.getMaxZ();
    let imageNode = (this.refs['canvasImage' + index] as CanvasImage).imageNode;
    imageNode.setZIndex(maxZ);
  };

  handleTouchEnd = (index: number, kind: string, startX: number, startY: number, ratio: number) => {
    let position = (this.refs[
      'canvasImage' + index
    ] as CanvasImage).imageNode.getAbsolutePosition();

    let width = this.props.gameSpec.board.width;
    let height = this.props.gameSpec.board.height;

    let endX = position.x / ratio / width * 100;
    let endY = position.y / ratio / height * 100;
    let distance = Math.sqrt((startX - endX) * (startX - endX) + (startY - endY) * (startY - endY));

    console.log('distance' + distance);
    if (distance < 0.00001) {
      // it's a touch instead of drag. I set it as 0,0001 because sometimes touch cause a tiny distance.
      if (kind === 'toggable') {
        this.togglePiece(index);
      } else if (kind === 'dice') {
        this.rollDice(index);
      } else if (kind === 'card') {
        this.toggleCardOptions('canvasImage' + index, index);
      }
    } else {
      // it's a drag
      this.helper.dragTo(index, endX, endY);
      const match: MatchInfo = this.mutableMatch;
      ourFirebase.updatePieceState(match, index);
      this.hideCardOptions();
    }
  };

  makeCardVisibleToSelf(index: number) {
    const match: MatchInfo = this.mutableMatch;
    this.helper.showMe(index);
    ourFirebase.updatePieceState(match, index);
    console.log('card show to me:', index);
    this.hideCardOptions();
  }

  makeCardVisibleToAll(index: number) {
    const match: MatchInfo = this.mutableMatch;
    this.helper.showEveryone(index);
    ourFirebase.updatePieceState(match, index);
    console.log('card show to everyone:', index);
    this.hideCardOptions();
  }

  makeCardHiddenToAll(index: number) {
    const match: MatchInfo = this.mutableMatch;
    this.helper.hideFromEveryone(index);
    ourFirebase.updatePieceState(match, index);
    console.log('card hide to everyone:', index);
    this.hideCardOptions();
  }

  toggleCardOptions(refString: string, cardIndex: number) {
    if (this.state.selectedPieceIndex === cardIndex) {
      // if we click on an already selected piece,
      // and the tooltip is not hided due to drag, then hide it
      this.hideCardOptions();
    } else {
      const imageNode = (this.refs[refString] as CanvasImage).imageNode;
      let position = imageNode.getAbsolutePosition();
      this.setState({
        tooltipPosition: {
          x: position.x,
          y: position.y
        },
        selectedPieceIndex: cardIndex
      });
    }
  }

  hideCardOptions() {
    console.log('hideCardOptions');
    this.setState({
      selectedPieceIndex: -1
    });
  }

  getRatio() {
    const boardImage = this.props.gameSpec.board;
    return getBoardRatio(boardImage);
  }

  render() {
    console.log('Board render');
    let boardImage = this.props.gameSpec.board.downloadURL;
    const width = this.props.gameSpec.board.width;
    const height = this.props.gameSpec.board.height;
    const ratio = this.getRatio();
    const match = this.mutableMatch;
    this.helper = new MatchStateHelper(match);

    let boardLayer = (
      <CanvasImage
        height={height * ratio}
        width={width * ratio}
        src={boardImage}
        onTouchStart={() => this.hideCardOptions()}
      />
    );

    let sortedMatchState = this.sortMatchStateByZ();

    // sortedMatchStateIndex is the index of pieceState in sortedMatchState
    // after we sort matchState according to z-index
    let piecesLayer = sortedMatchState.map(compoundMatchState => {
      // index is the index of piece in gameSpec according to sortedMatchState[sortedMatchStateIndex]
      let piece = compoundMatchState.pieceState;
      let index = compoundMatchState.originalIndex;
      const pieceSpec = this.props.gameSpec.pieces[index];
      let kind = pieceSpec.element.elementKind;
      if (kind.endsWith('Deck')) {
        return null;
      }
      let isVisible = piece.cardVisibilityPerIndex[this.selfParticipantIndex()];
      let imageIndex: number =
        pieceSpec.element.elementKind === 'card' ? (isVisible ? 0 : 1) : piece.currentImageIndex;
      // let zIndex = piece.zDepth;
      let imageSrc: string = pieceSpec.element.images[imageIndex].downloadURL;
      return (
        <CanvasImage
          ref={'canvasImage' + index}
          key={index}
          draggable={pieceSpec.element.isDraggable}
          height={pieceSpec.element.height * ratio}
          width={pieceSpec.element.width * ratio}
          x={piece.x * width / 100 * ratio}
          y={piece.y * height / 100 * ratio}
          src={imageSrc}
          onTouchEnd={() => {
            console.log('onTouchEnd');
            let startX = piece.x;
            let startY = piece.y;
            this.handleTouchEnd(index, kind, startX, startY, ratio);
          }}
          onDragStart={() => {
            this.audioPlaying(dragStartAudio);
            this.updateZIndex(index);
            console.log('onDragStart');
          }}
        />
      );
    });

    const selectedPieceIndex = this.state.selectedPieceIndex;
    let toolTipLayer: JSX.Element | null = null;
    if (selectedPieceIndex !== -1) {
      const cardVisibilityPerIndex = match.matchState[selectedPieceIndex].cardVisibilityPerIndex;
      toolTipLayer = (
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
            left: this.state.tooltipPosition.x,
            top: this.state.tooltipPosition.y,
            position: 'absolute',
            display: 'initial',
            zIndex: 100,
            background: 'white',
            width: '40px',
            height: '40px'
          }}
        >
          <MenuItem
            rightIcon={<Person />}
            primaryText={'Show me'}
            disabled={cardVisibilityPerIndex[this.selfParticipantIndex()]}
            onClick={() => {
              this.makeCardVisibleToSelf(selectedPieceIndex);
            }}
          />
          <MenuItem
            rightIcon={<People />}
            primaryText={'Show everyone'}
            disabled={
              Object.keys(cardVisibilityPerIndex).length === match.participantsUserIds.length
            }
            onClick={() => {
              this.makeCardVisibleToAll(selectedPieceIndex);
            }}
          />
          <MenuItem
            rightIcon={<PeopleOutline />}
            primaryText={'Hide'}
            disabled={Object.keys(cardVisibilityPerIndex).length === 0}
            onClick={() => {
              this.makeCardHiddenToAll(selectedPieceIndex);
            }}
          />
          <MenuItem
            style={{ color: red500 }}
            rightIcon={<Shuffle color={red500} />}
            primaryText={'Shuffle deck'}
            onClick={() => {
              this.shuffleDeck(this.props.gameSpec.pieces[selectedPieceIndex].deckPieceIndex);
            }}
          />
        </IconMenu>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        {toolTipLayer}
        <Stage width={width * ratio} height={height * ratio}>
          <Layer ref={() => 'boardLayer'}>{boardLayer}</Layer>
          {/* <Layer ref={() => 'trashLayer'}>{trashLayer}</Layer> */}
          <Layer ref={() => 'piecesLayer'}>{piecesLayer}</Layer>
        </Stage>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState): BoardPropsFromState => {
  return {
    myUserId: state.myUser.myUserId,
    audioMute: state.audioMute,
    windowDimensions: state.windowDimensions
  };
};
export default connect(mapStateToProps)(Board);
