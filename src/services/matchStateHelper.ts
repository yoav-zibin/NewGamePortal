import { MatchInfo, GameSpec, BooleanIndexer, MatchState } from '../types';
import { checkCondition, checkNotNull, deepCopy } from '../globals';
import { store } from '../stores';

export class MatchStateHelper {
  spec: GameSpec;

  static createInitialState(spec: GameSpec): MatchState {
    checkNotNull(spec);
    const m: MatchInfo = <MatchInfo>{ gameSpecId: spec.gameSpecId };
    new MatchStateHelper(m).resetMatch();
    return m.matchState;
  }

  // All functions will modify match.matchState.
  constructor(private match: MatchInfo) {
    this.spec = checkNotNull(
      store.getState().gameSpecs.gameSpecIdToGameSpec[match.gameSpecId]
    );
  }

  dragTo(pieceIndex: number, x: number, y: number) {
    checkCondition('dragToXY', -100 <= x && x <= 100 && -100 <= y && y <= 100);
    const pieceSpec = this.getPieceSpec(pieceIndex);
    checkCondition('dragTo', pieceSpec.isDraggable);
    const pieceState = this.getPieceState(pieceIndex);
    pieceState.x = x;
    pieceState.y = y;
    this.setMaxZ(pieceIndex);
  }

  toggleImage(pieceIndex: number) {
    const pieceSpec = this.getPieceSpec(pieceIndex);
    checkCondition('toggleImage', pieceSpec.elementKind === 'toggable');
    const pieceState = this.getPieceState(pieceIndex);
    const currIndex = pieceState.currentImageIndex;
    pieceState.currentImageIndex =
      currIndex === pieceSpec.images.length - 1 ? 0 : currIndex + 1;
    this.setMaxZ(pieceIndex);
  }

  rollDice(diceIndex: number) {
    console.log('roll dice in helper');
    const pieceSpec = this.getPieceSpec(diceIndex);
    checkCondition('rollDice', pieceSpec.elementKind === 'dice');
    const imagesNum = pieceSpec.images.length;
    this.getPieceState(diceIndex).currentImageIndex = Math.floor(
      imagesNum * Math.random()
    );
    // To notify the firebase that someone has rolled a dice
    // (so that other users can see a rolling dice animation)
    // we add the z-depth of dice
    this.getPieceState(diceIndex).zDepth += 1;
  }

  // Show a card to me (look/peek at the card).
  showMe(cardIndex: number) {
    this.checkCard(cardIndex);
    const myUserId = store.getState().myUser.myUserId;
    const myIndex = this.match.participantsUserIds.indexOf(myUserId);
    const pieceState = this.getPieceState(cardIndex);
    pieceState.cardVisibilityPerIndex[myIndex] = true;
  }

  // Show a card to everyone (flip the card)
  showEveryone(cardIndex: number) {
    this.checkCard(cardIndex);
    const pieceState = this.getPieceState(cardIndex);
    this.match.participantsUserIds.forEach((_userId, index) => {
      pieceState.cardVisibilityPerIndex[index] = true;
    });
  }

  // Hide a card from everyone (flip the card again)
  hideFromEveryone(cardIndex: number) {
    this.checkCard(cardIndex);
    const pieceState = this.getPieceState(cardIndex);
    pieceState.cardVisibilityPerIndex = {};
  }

  // Shuffle a deck (updating x,y,z, and cardVisibilityPerIndex of all deck members)
  shuffleDeck(deckPieceIndex: number) {
    console.log('Shuffling deck: ', deckPieceIndex);
    const spec = this.spec;
    const deck = checkNotNull(spec.pieces[deckPieceIndex]);
    const deckKind = deck.element.elementKind;
    checkCondition('shuffleDeck', deckKind.endsWith('Deck'));
    const deckPos = deck.initialState;
    const isCardsDeck = deckKind === 'cardsDeck';
    // Updating the x,y,z, and cardVisibilityPerIndex of all deck members
    const maxZ = this.getMaxZ();
    this.match.matchState.forEach((p, index) => {
      if (spec.pieces[index].deckPieceIndex !== deckPieceIndex) {
        return;
      }
      this.checkCard(index);
      const position = Math.random();
      p.zDepth = maxZ + position;
      // For cardsDeck, we modify the x&y by 0-1%
      // For piecesDeck, we modify the x&y by the height&width of the deck.
      if (isCardsDeck) {
        p.x = deckPos.x + position;
        p.y = deckPos.y + position;
      } else {
        const deckHeightPercent = deck.element.height / spec.board.height;
        const deckWidthPercent = deck.element.width / spec.board.width;
        p.x = deckPos.x + position * deckWidthPercent;
        p.y = deckPos.y + position * deckHeightPercent;
      }
      p.cardVisibilityPerIndex = {}; // Hidden from everyone.
    });
  }

  resetMatch() {
    this.match.matchState = this.spec.pieces.map(piece =>
      deepCopy(piece.initialState)
    );
    const decksShuffled: BooleanIndexer = {};
    this.spec.pieces.forEach((p, index) => {
      if (p.element.elementKind === 'dice') {
        this.rollDice(index);
      } else if (
        p.deckPieceIndex !== -1 &&
        !(p.deckPieceIndex in decksShuffled)
      ) {
        decksShuffled[p.deckPieceIndex] = true;
        this.shuffleDeck(p.deckPieceIndex);
      }
    });
  }

  getMaxZ() {
    return Math.max(
      ...this.match.matchState.map(pieceState => pieceState.zDepth)
    );
  }

  setMaxZ(pieceIndex: number) {
    this.getPieceState(pieceIndex).zDepth = this.getMaxZ() + 1;
  }

  private getPieceState(pieceIndex: number) {
    return this.match.matchState[pieceIndex];
  }
  private getPieceSpec(pieceIndex: number) {
    return this.spec.pieces[pieceIndex].element;
  }
  private checkCard(cardIndex: number) {
    checkCondition('card', this.getPieceSpec(cardIndex).elementKind === 'card');
  }
}
