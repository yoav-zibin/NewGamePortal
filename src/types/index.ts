// TODO: Add more information to the state
export interface StoreState {
  gamesList: GameInfo[];
  imageIdToImage: ImageIdToImage;
  elementIdToElement: ElementIdToImage;

  matchesList: MatchInfo[];
  currentMatchIndex: number; // an index in matchesList

  contacts: Contact[]; // Coming from the phone contacts
  phoneNumberToUserId: PhoneNumberToUserId; // Coming from firebase.
  userIdToPhoneNumber: UserIdToPhoneNumber; // Coming from firebase.
  myUserId: string;
}

export interface ImageIdToImage {
  [imageId: string]: Image;
}

export interface ElementIdToImage {
  [elementId: string]: Element;
}

export interface PhoneNumberToUserId {
  [phoneNumber: string]: string;
}

export interface UserIdToPhoneNumber {
  [userId: string]: string;
}

export interface Contact {
  phoneNumber: string; // Must match /^[+0-9]{5,20}$/
  name: string;
  avatarImage: string;
}

export interface Image {
  imageId: string;
  width: number;
  height: number;
  isBoardImage: boolean;
  downloadURL: string;
}

// The info we need to display the game in GamesList component.
export interface GameInfo {
  gameSpecId: string;
  gameName: string;
  screenShoot: Image;

  gameSpec?: GameSpec; // Lazily loaded.
}

export interface GameSpec {
  board: Image;
  pieces: Piece[];
}

export interface CardVisibility {
  [participantIndex: string]: boolean;
}

export interface PieceState {
  x: number;
  y: number;
  zDepth: number;
  currentImageIndex: number;
  cardVisibility: CardVisibility;
}

export interface MatchInfo {
  matchId: string;
  game: GameInfo;
  participantsUserIds: string[]; // including myself
  lastUpdatedOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
  matchState?: MatchState; // Lazily loaded.
}

export interface MatchState {
  [pieceIndex: string]: PieceState;
}

export interface Piece {
  element: Element;
  initialState: PieceState;
  deckPieceIndex: number;
}

export interface Element {
  elementId: string;
  width: number;
  height: number;
  images: Image[];
  isDraggable: boolean;
  elementKind: 'standard'|'toggable'|'dice'|'card'|'cardsDeck'|'piecesDeck';
  deckElements: Element[];
  // rotatableDegrees: number;
  // isDrawable: boolean;
}