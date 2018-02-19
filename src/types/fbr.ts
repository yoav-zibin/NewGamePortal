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

  interface GameBuilder {
    images: Images;
    elements: Elements;
    gameSpecs: GameSpecs;
  }

  interface PublicFields {
    avatarImageUrl: string;
    displayName: string;
    isConnected: boolean;
    supportsWebRTC: boolean;
    lastSeen: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface Friends {
    [friendUserId: string]: boolean;
  }

  interface FcmToken {
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    lastTimeReceived: number/*firebase.database.ServerValue.TIMESTAMP*/;
    platform: 'web'|'ios'|'android';
    app: 'GamePortalAngular'|'GamePortalReact'|'GamePortalReactNative'|'GamePortalAndroid';
  }

  interface FcmTokens {
    [fcmToken: string]: FcmToken;
  }

  interface PrivateFields {
    email: string;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    phoneNumber: string;
    facebookId: string;
    googleId: string;
    twitterId: string;
    githubId: string;
    friends: Friends;
    pushNotificationsToken: string;
    fcmTokens: FcmTokens;
  }

  interface GroupMembership {
    addedByUid: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface GroupMemberships {
    [memberOfGroupId: string]: GroupMembership;
  }

  interface SignalEntry {
    addedByUid: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
    signalType: 'WannaTalk'|'YesLetsTalk'|'Nope'|'sdp'|'candidate';
    signalData: string;
  }

  interface Signal {
    [signalEntryId: string]: SignalEntry;
  }

  interface PrivateButAddable {
    groups: GroupMemberships;
    signal: Signal;
  }

  interface User {
    publicFields: PublicFields;
    privateFields: PrivateFields;
    privateButAddable: PrivateButAddable;
  }

  interface Users {
    [userId: string]: User;
  }

  interface RecentlyConnectedEntry {
    userId: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface RecentlyConnected {
    [recentlyConnectedEntryId: string]: RecentlyConnectedEntry;
  }

  interface StarReview {
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
    stars: number;
  }

  interface StarReviewsForGame {
    [reviewerUserId: string]: StarReview;
  }

  interface Reviews {
    [reviewedGameSpecId: string]: StarReviewsForGame;
  }

  interface StarsSummaryForGame {
    stars1Count: number;
    stars2Count: number;
    stars3Count: number;
    stars4Count: number;
    stars5Count: number;
  }

  interface StarsSummary {
    [reviewedGameSpecId: string]: StarsSummaryForGame;
  }

  interface GamesReviews {
    reviews: Reviews;
    starsSummary: StarsSummary;
  }

  interface ParticipantUser {
    participantIndex: number;
  }

  interface Participants {
    [participantUserId: string]: ParticipantUser;
  }

  interface Message {
    senderUid: string;
    message: string;
    timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface Messages {
    [messageId: string]: Message;
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
    gameSpecId: string;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    lastUpdatedOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    pieces: PiecesState;
  }

  interface Matches {
    [matchId: string]: Match;
  }

  interface Group {
    participants: Participants;
    groupName: string;
    createdOn: number/*firebase.database.ServerValue.TIMESTAMP*/;
    messages: Messages;
    matches: Matches;
  }

  interface Groups {
    [groupId: string]: Group;
  }

  interface FieldValue {
    [userId: string]: number/*firebase.database.ServerValue.TIMESTAMP*/;
  }

  interface DisplayNameIndex {
    [fieldValue: string]: FieldValue;
  }

  interface EmailIndex {
    [fieldValue: string]: FieldValue;
  }

  interface PhoneNumberIndex {
    [fieldValue: string]: FieldValue;
  }

  interface FacebookIndex {
    [fieldValue: string]: FieldValue;
  }

  interface GoogleIndex {
    [fieldValue: string]: FieldValue;
  }

  interface TwitterIndex {
    [fieldValue: string]: FieldValue;
  }

  interface GithubIndex {
    [fieldValue: string]: FieldValue;
  }

  interface UserIdIndices {
    displayName: DisplayNameIndex;
    email: EmailIndex;
    phoneNumber: PhoneNumberIndex;
    facebookId: FacebookIndex;
    googleId: GoogleIndex;
    twitterId: TwitterIndex;
    githubId: GithubIndex;
  }

  interface GamePortal {
    recentlyConnected: RecentlyConnected;
    gameSpec: GamesReviews;
    groups: Groups;
    userIdIndices: UserIdIndices;
  }

  interface FirebaseDb {
    gameBuilder: GameBuilder;
    users: Users;
    gamePortal: GamePortal;
  }

}