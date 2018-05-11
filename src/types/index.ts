import { CSSProperties } from 'react';

export interface PhoneNumInfo {
  number: string;
  isPossibleNumber: boolean;
  isValidNumber: boolean;
  isValidNumberForRegion: boolean;
  maybeMobileNumber: boolean;
  internationalFormat: string;
  e164Format: string;
}

export type PlatformType = 'ios' | 'android' | 'web' | 'tests';
export interface RouterMatchParams {
  params: {
    matchIdInRoute: string;
  };
}

export interface StoreState {
  gamesList: GameInfo[];

  // gameSpecs will be loaded lazily, i.e.,
  // not every game in gamesList will have an entry in gameSpecs.
  gameSpecs: GameSpecs;

  matchesList: MatchInfo[];

  phoneNumberToContact: PhoneNumberToContact; // Coming from the phone contacts
  // Not all users are in our contacts, e.g., if a user that isn't in my contacts
  // added me to a match.
  // In this case, the UI will show the name in publicFields/displayName.
  userIdToInfo: UserIdToInfo;

  myUser: MyUser;

  signals: SignalEntry[];

  // Whether to play game sounds (it doesn't mute the video chat)
  audioMute: boolean;

  // Components that need to redraw based on window.innerWidth/innerHeight
  // I've renamed "innerWidth" to "windowWidth" to avoid shadowing the variables
  // (and make windowWidth easy to find).
  windowDimensions?: WindowDimensions;
}

export interface WindowDimensions {
  windowWidth: number;
  windowHeight: number;
}

export interface UserInfo {
  userId: string;
  displayName: string;
  phoneNumber?: string; // phoneNumber is set if this user came from contacts
}

export interface MyUser {
  myName: string;
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
export type UserIdToInfo = IdIndexer<UserInfo>;
export type StringIndexer = IdIndexer<string>;
export type BooleanIndexer = IdIndexer<boolean>;
export type NumberIndexer = IdIndexer<number>;
export type CSSPropertiesIndexer = IdIndexer<CSSProperties>;
export type AnyIndexer = IdIndexer<any>;

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
  [participantIndex: string]: true;
}

export type MatchState = PieceState[];

export interface Contact {
  phoneNumber: string; // Must match /^[+][0-9]{5,20}$/
  name: string;
}
export interface ContactWithUserId extends Contact {
  userId: string;
}

export interface Opponent {
  name: string;
  userId: string;
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
  wikipediaUrl: string;
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
  updatedByUserId: string;
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
  elementKind: 'standard' | 'toggable' | 'dice' | 'card' | 'cardsDeck' | 'piecesDeck';
  // Not needed in GamePortal:  deckElements: Element[];
  // We'll add in the future:
  // rotatableDegrees: number;
  // isDrawable: boolean;
}
