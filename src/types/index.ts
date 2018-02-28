// TODO: Add more information to the state
export interface StoreState {
  gamesList: GameInfo[];

  // gameSpecs will be loaded lazily, i.e.,
  // not every game in gamesList will have an entry in gameSpecs.
  gameSpecs: GameSpecs;

  matchesList: MatchInfo[];
  currentMatchIndex: number; // an index in matchesList

  // Match state will be loaded lazily, i.e.,
  // not every match in matchesList will have an entry in matchIdToMatchState.
  matchIdToMatchState: MatchIdToMatchState;

  phoneNumberToContact: PhoneNumberToContact; // Coming from the phone contacts
  userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers; // Coming from firebase.

  myUser: MyUser;

  signals: SignalEntry[];
}

export interface UserIdsAndPhoneNumbers {
  phoneNumberToUserId: PhoneNumberToUserId;
  userIdToPhoneNumber: UserIdToPhoneNumber; // Calculated whenever
}

export interface MyUser {
  myUserId: string;
  myPhoneNumber: string;
}

export interface SignalEntry {
  addedByUid: string;
  timestamp: number /*firebase.database.ServerValue.TIMESTAMP*/;
  signalType: 'sdp' | 'candidate';
  signalData: string;
}

export interface GameSpecs {
  imageIdToImage: ImageIdToImage;
  elementIdToElement: ElementIdToImage;
  gameSpecIdToGameSpec: GameSpecIdToGameSpec;
}

export interface IdIndexer<T> {
  [id: string]: T;
}

export interface PhoneNumberToContact extends IdIndexer<Contact> {
  [phoneNumber: string]: Contact;
}

export interface GameSpecIdToGameSpec extends IdIndexer<GameSpec> {
  [gameSpecId: string]: GameSpec;
}

export interface MatchIdToMatchState extends IdIndexer<MatchState> {
  [matchId: string]: MatchState;
}

export interface ImageIdToImage extends IdIndexer<Image> {
  [imageId: string]: Image;
}

export interface ElementIdToImage extends IdIndexer<Element> {
  [elementId: string]: Element;
}

export interface PhoneNumberToUserId extends IdIndexer<string> {
  [phoneNumber: string]: string;
}

export interface UserIdToPhoneNumber extends IdIndexer<string> {
  [userId: string]: string;
}

export interface CardVisibility extends IdIndexer<boolean> {
  [participantIndex: string]: boolean;
}

export interface MatchState extends IdIndexer<PieceState> {
  [pieceIndex: string]: PieceState;
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
}

export interface GameSpec {
  board: Image;
  pieces: Piece[];
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
  lastUpdatedOn: number /*firebase.database.ServerValue.TIMESTAMP*/;
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
  elementKind:
    | 'standard'
    | 'toggable'
    | 'dice'
    | 'card'
    | 'cardsDeck'
    | 'piecesDeck';
  deckElements: Element[];
  // rotatableDegrees: number;
  // isDrawable: boolean;
}
