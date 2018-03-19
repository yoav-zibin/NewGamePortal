export interface StoreState {
  gamesList: GameInfo[];

  // gameSpecs will be loaded lazily, i.e.,
  // not every game in gamesList will have an entry in gameSpecs.
  gameSpecs: GameSpecs;

  matchesList: MatchInfo[];
  currentMatchIndex: number; // an index in matchesList

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
  myCountryCode: string; // 2-letter country code
}

export type SignalEntry = fbr.SignalEntry;

export interface GameSpecs {
  imageIdToImage: ImageIdToImage;
  elementIdToElement: ElementIdToElement;
  gameSpecIdToGameSpec: GameSpecIdToGameSpec;
}

export interface IdIndexer<T> {
  [id: string]: T;
}
export type StringIndexer = IdIndexer<string>;
export type BooleanIndexer = IdIndexer<boolean>;

export interface PhoneNumberToContact extends IdIndexer<Contact> {
  [phoneNumber: string]: Contact;
}

export interface GameSpecIdToGameSpec extends IdIndexer<GameSpec> {
  [gameSpecId: string]: GameSpec;
}

export interface ImageIdToImage extends IdIndexer<Image> {
  [imageId: string]: Image;
}

export interface ElementIdToElement extends IdIndexer<Element> {
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

export type MatchState = PieceState[];

export interface Contact {
  phoneNumber: string; // Must match /^[+][0-9]{5,20}$/
  name: string;
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
  screenShot: Image;
}

export interface GameSpec {
  gameSpecId: string;
  board: Image;
  pieces: Piece[];
}

export interface PieceState {
  x: number;
  y: number;
  zDepth: number;
  currentImageIndex: number;
  cardVisibilityPerIndex: CardVisibility;
}

export interface MatchInfo {
  matchId: string;
  gameSpecId: string;
  game: GameInfo;
  participantsUserIds: string[]; // including myself
  lastUpdatedOn: number /*firebase.database.ServerValue.TIMESTAMP*/;
  matchState: MatchState;
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
  // Not needed in GamePortal:  deckElements: Element[];
  // We'll add in the future:
  // rotatableDegrees: number;
  // isDrawable: boolean;
}
