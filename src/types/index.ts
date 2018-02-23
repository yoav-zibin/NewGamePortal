// TODO: Add more information to the state
export interface StoreState {
  gamesList: GameInfo[];
  matchesList: MatchInfo[];
  currentMatchIndex: number; // an index in matchesList
  contacts: Contact[];
  users: User[];
}

export interface Contact {
  name: string;
  phoneNumber: string;
  avatarImage: string;
}

export interface User {
  userId: string;
  conact: Contact;
  isConnected: boolean;
  supportsWebRTC: boolean;
  lastSeen: number/*firebase.database.ServerValue.TIMESTAMP*/;
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
  groupId: string;
  game: GameInfo;
  participants: User[]; // including myself
  lastUpdatedOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
  piecesState?: PiecesState; // Lazily loaded.
}

export interface PiecesState {
  [pieceIndex: string]: PieceState;
}

export interface Piece {
  element: Element;
  initialState: PieceState;
  deckPieceIndex: number;
}

export interface Element {
  width: number;
  height: number;
  images: Image[];
  isDraggable: boolean;
  elementKind: 'standard'|'toggable'|'dice'|'card'|'cardsDeck'|'piecesDeck';
  deckElements: Element[];
  // rotatableDegrees: number;
  // isDrawable: boolean;
}