declare namespace fbr { // fbr stands for Fire Base Rules

  interface Image {
    uploaderEmail: string;
    uploaderUid: string;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    width: number;
    height: number;
    isBoardImage: boolean;
    downloadURL: string;
    sizeInBytes: number;
    cloudStoragePath: string;
    name: string;
  }

  interface Images {
    [imageId: string]: Image;
  }

  interface ElementImage {
    imageId: string;
  }

  interface ElementImages {
    [imageIndex: string]: ElementImage;
  }

  interface DeckMember {
    deckMemberElementId: string;
  }

  interface DeckElements {
    [deckMemberIndex: string]: DeckMember;
  }

  interface Element {
    uploaderEmail: string;
    uploaderUid: string;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    width: number;
    height: number;
    name: string;
    images: ElementImages;
    isDraggable: boolean;
    elementKind: 'standard'|'toggable'|'dice'|'card'|'cardsDeck'|'piecesDeck';
    rotatableDegrees: number;
    deckElements: DeckElements;
    isDrawable: boolean;
  }

  interface Elements {
    [elementId: string]: Element;
  }

  interface Board {
    imageId: string;
    backgroundColor: string;
    maxScale: number;
  }

  interface CardVisibility {
    [participantIndex: string]: boolean;
  }

  interface Line {
    userId: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
    color: string;
    lineThickness: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }

  interface Drawing {
    [lineId: string]: Line;
  }

  interface InitialState {
    x: number;
    y: number;
    zDepth: number;
    currentImageIndex: number;
    cardVisibility: CardVisibility;
    rotationDegrees: number;
    drawing: Drawing;
  }

  interface Piece {
    pieceElementId: string;
    initialState: InitialState;
    deckPieceIndex: number;
  }

  interface Pieces {
    [pieceIndex: string]: Piece;
  }

  interface GameSpec {
    uploaderEmail: string;
    uploaderUid: string;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    gameName: string;
    gameIcon50x50: string;
    gameIcon512x512: string;
    screenShootImageId: string;
    wikipediaUrl: string;
    tutorialYoutubeVideo: string;
    board: Board;
    pieces: Pieces;
  }

  interface GameSpecs {
    [gameSpecId: string]: GameSpec;
  }

  interface GameBuilderUser {
    avatarImageUrl: string;
    displayName: string;
    lastSeen: number/*firebase.database.ServerValue.TIMESTAMP*/;
    email: string;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface GameBuilderUsers {
    [gameBuilderUserId: string]: GameBuilderUser;
  }

  interface GameBuilder {
    images: Images;
    elements: Elements;
    gameSpecs: GameSpecs;
    gameBuilderUsers: GameBuilderUsers;
  }

  interface PhoneNumber {
    userId: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface PhoneNumberToUser {
    [phoneNumber: string]: PhoneNumber;
  }

  interface FcmToken {
    lastTimeReceived: number/*firebase.database.ServerValue.TIMESTAMP*/;
    platform: 'ios'|'android';
  }

  interface FcmTokens {
    [fcmToken: string]: FcmToken;
  }

  interface PrivateFields {
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    phoneNumber: string;
    fcmTokens: FcmTokens;
  }

  interface MatchMembership {
    addedByUid: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface MatchMemberships {
    [matchMembershipId: string]: MatchMembership;
  }

  interface SignalEntry {
    addedByUid: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
    signalType: 'sdp'|'candidate';
    signalData: string;
  }

  interface Signals {
    [signalEntryId: string]: SignalEntry;
  }

  interface PrivateButAddable {
    matchMemberships: MatchMemberships;
    signals: Signals;
  }

  interface GamePortalUser {
    privateFields: PrivateFields;
    privateButAddable: PrivateButAddable;
  }

  interface GamePortalUsers {
    [gamePortalUserId: string]: GamePortalUser;
  }

  interface ParticipantUser {
    participantIndex: number;
    pingOpponents: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface Participants {
    [participantUserId: string]: ParticipantUser;
  }

  interface CurrentState {
    x: number;
    y: number;
    zDepth: number;
    currentImageIndex: number;
    cardVisibility: CardVisibility;
    rotationDegrees: number;
    drawing: Drawing;
  }

  interface PieceState {
    currentState: CurrentState;
  }

  interface PiecesState {
    [pieceIndex: string]: PieceState;
  }

  interface Match {
    participants: Participants;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    lastUpdatedOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    gameSpecId: string;
    pieces: PiecesState;
  }

  interface Matches {
    [matchId: string]: Match;
  }

  interface GamePortal {
    phoneNumberToUserId: PhoneNumberToUser;
    gamePortalUsers: GamePortalUsers;
    matches: Matches;
  }

  interface FirebaseDb {
    gameBuilder: GameBuilder;
    gamePortal: GamePortal;
  }

}