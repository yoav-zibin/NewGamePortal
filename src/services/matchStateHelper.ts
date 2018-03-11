import { MatchInfo, GameSpec } from '../types';
import { checkCondition, checkNotNull } from '../globals';

export class MatchStateHelper {
  // All functions will modify match.matchState.
  constructor(
    private match: MatchInfo,
    private myUserId: string,
    private spec: GameSpec
  ) {}

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
    const pieceSpec = this.getPieceSpec(diceIndex);
    checkCondition('rollDice', pieceSpec.elementKind === 'dice');
    const imagesNum = pieceSpec.images.length;
    this.getPieceState(diceIndex).currentImageIndex = Math.floor(
      imagesNum * Math.random()
    );
  }

  // Show a card to me (look/peek at the card).
  showMe(cardIndex: number) {
    this.checkCard(cardIndex);
    const myIndex = this.match.participantsUserIds.indexOf(this.myUserId);
    const pieceState = this.getPieceState(cardIndex);
    pieceState.cardVisibility[myIndex] = true;
  }

  // Show a card to everyone (flip the card)
  showEveryone(cardIndex: number) {
    this.checkCard(cardIndex);
    const pieceState = this.getPieceState(cardIndex);
    this.match.participantsUserIds.forEach((_userId, index) => {
      pieceState.cardVisibility[index] = true;
    });
  }

  // Hide a card from everyone (flip the card again)
  hideFromEveryone(cardIndex: number) {
    this.checkCard(cardIndex);
    const pieceState = this.getPieceState(cardIndex);
    pieceState.cardVisibility = {};
  }

  // Shuffle a deck (updating x,y,z, and cardVisibility of all deck members)
  shuffleDeck(deckPieceIndex: number) {
    const spec = this.spec;
    const deck = checkNotNull(spec.pieces[deckPieceIndex]);
    const deckKind = deck.element.elementKind;
    checkCondition('shuffleDeck', deckKind.endsWith('Deck'));
    const deckPos = deck.initialState;
    const isCardsDeck = deckKind === 'cardsDeck';
    // Updating the x,y,z, and cardVisibility of all deck members
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
      p.cardVisibility = {}; // Hidden from everyone.
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
