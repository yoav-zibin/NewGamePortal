import { Reducer } from 'redux';
import {
  StoreState,
  GameInfo,
  GameSpecs,
  MatchInfo,
  PhoneNumberToContact,
  UserIdsAndPhoneNumbers,
  SignalEntry,
  IdIndexer,
  MyUser
} from '../types';
import { storeStateDefault } from '../stores/defaults';
import { checkCondition, getValues } from '../globals';

export interface Action {
  // Actions that start with "set" mean that they replace the matching
  // part in the store.
  // In contrast, actions that start with "update" will update mappigns
  // (using mergeMaps below).
  setGamesList?: GameInfo[];
  updateGameSpecs?: GameSpecs;
  setMatchesList?: MatchInfo[];
  setCurrentMatchIndex?: number; // an index in matchesList
  updatePhoneNumberToContact?: PhoneNumberToContact;
  updateUserIdsAndPhoneNumbers?: UserIdsAndPhoneNumbers;
  setMyUser?: MyUser;
  setSignals?: SignalEntry[];
}

export function mergeMaps<T>(
  original: IdIndexer<T>,
  updateWithEntries: IdIndexer<T>
): IdIndexer<T> {
  return Object.assign(original, updateWithEntries);
}

function isInRange(currentMatchIndex: number, matchesList: MatchInfo[]) {
  return currentMatchIndex >= -1 && currentMatchIndex < matchesList.length;
}

function checkEqual(x: string[], y: string[]) {
  if (x.length !== y.length) {
    return false;
  }
  for (var i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) {
      return false;
    }
  }
  return true;
}

function checkStoreInvariants(state: StoreState) {
  checkCondition(
    'currentMatchIndex is in range',
    isInRange(state.currentMatchIndex, state.matchesList)
  );
  state.matchesList.forEach(match => {
    checkCondition(
      'I play in match',
      match.participantsUserIds.indexOf(state.myUser.myUserId) !== -1
    );
    checkCondition(
      'correct num pieces',
      match.matchState.length ===
        state.gameSpecs.gameSpecIdToGameSpec[match.game.gameSpecId].pieces
          .length
    );
  });

  const userIdsAndPhoneNumbers = state.userIdsAndPhoneNumbers;
  checkCondition(
    'UserIdsAndPhoneNumbers have two mappings that are exactly the reverse of each other',
    checkEqual(
      Object.keys(userIdsAndPhoneNumbers.phoneNumberToUserId),
      getValues(userIdsAndPhoneNumbers.userIdToPhoneNumber)
    ) &&
      checkEqual(
        Object.keys(userIdsAndPhoneNumbers.userIdToPhoneNumber),
        getValues(userIdsAndPhoneNumbers.phoneNumberToUserId)
      )
  );

  const {
    elementIdToElement,
    imageIdToImage,
    gameSpecIdToGameSpec
  } = state.gameSpecs;
  Object.keys(gameSpecIdToGameSpec).forEach(gameSpecId => {
    const gameSpec = gameSpecIdToGameSpec[gameSpecId];
    checkCondition(
      'board image must be in imageIdToImage',
      gameSpec.board === imageIdToImage[gameSpec.board.imageId]
    );
    checkCondition(
      'board image must have isBoardImage=true',
      gameSpec.board.isBoardImage
    );
    gameSpec.pieces.forEach(piece => {
      checkCondition(
        'Every piece element must be in elementIdToElement',
        piece.element === elementIdToElement[piece.element.elementId]
      );
      if (piece.deckPieceIndex !== -1) {
        checkCondition(
          'piece must be a card to have deckPieceIndex',
          piece.element.elementKind === 'card'
        );
        const deck = gameSpec.pieces[piece.deckPieceIndex].element;
        checkCondition(
          'deckPieceIndex points to a deck',
          deck.elementKind.endsWith('Deck')
        );
      }
    });
  });
  Object.keys(elementIdToElement).forEach(elementId => {
    const element = elementIdToElement[elementId];
    element.images.forEach(image => {
      checkCondition(
        'element image must be in imageIdToImage',
        image === imageIdToImage[image.imageId]
      );
    });
    // Some checks based on the element kind
    switch (element.elementKind) {
      case 'standard':
        checkCondition(
          'standard piece has 1 image',
          element.images.length === 1
        );
        break;
      case 'toggable':
      case 'dice':
        checkCondition(
          'toggable|diece piece has 1 or more images',
          element.images.length >= 1
        );
        break;
      case 'card':
        checkCondition('card piece has 2 images', element.images.length === 2);
        break;
      case 'cardsDeck':
      case 'piecesDeck':
        checkCondition('deck has 1 image', element.images.length === 1);
        break;
      default:
        checkCondition('Illegal elementKind=' + element.elementKind, false);
        break;
    }
  });
}

function reduce(state: StoreState, action: Action) {
  if (action.setGamesList) {
    return { ...state, gamesList: action.setGamesList };
  } else if (action.setMatchesList) {
    let { matchesList, currentMatchIndex, ...rest } = state;
    if (!isInRange(state.currentMatchIndex, action.setMatchesList)) {
      currentMatchIndex = -1;
    }
    return {
      ...rest,
      matchesList: action.setMatchesList,
      currentMatchIndex: currentMatchIndex
    };
  } else if (action.setSignals) {
    return { ...state, signals: action.setSignals };
  } else if (action.setMyUser) {
    return { ...state, myUser: action.setMyUser };
  } else if (action.updatePhoneNumberToContact) {
    let { phoneNumberToContact, ...rest } = state;
    return {
      phoneNumberToContact: mergeMaps(
        phoneNumberToContact,
        action.updatePhoneNumberToContact
      ),
      ...rest
    };
  } else if (action.updateUserIdsAndPhoneNumbers) {
    let { userIdsAndPhoneNumbers, ...rest } = state;
    return {
      userIdsAndPhoneNumbers: {
        phoneNumberToUserId: mergeMaps(
          userIdsAndPhoneNumbers.phoneNumberToUserId,
          action.updateUserIdsAndPhoneNumbers.phoneNumberToUserId
        ),
        userIdToPhoneNumber: mergeMaps(
          userIdsAndPhoneNumbers.userIdToPhoneNumber,
          action.updateUserIdsAndPhoneNumbers.userIdToPhoneNumber
        )
      },
      ...rest
    };
  } else if (action.setCurrentMatchIndex) {
    return { ...state, currentMatchIndex: action.setCurrentMatchIndex };
  } else if (action.updateGameSpecs) {
    let {
      imageIdToImage,
      elementIdToElement,
      gameSpecIdToGameSpec
    } = action.updateGameSpecs;
    let { gameSpecs, ...rest } = state;
    return {
      gameSpecs: {
        imageIdToImage: mergeMaps(gameSpecs.imageIdToImage, imageIdToImage),
        elementIdToElement: mergeMaps(
          gameSpecs.elementIdToElement,
          elementIdToElement
        ),
        gameSpecIdToGameSpec: mergeMaps(
          gameSpecs.gameSpecIdToGameSpec,
          gameSpecIdToGameSpec
        )
      },
      ...rest
    };
  } else {
    return state;
  }
}

export const reducer: Reducer<StoreState> = (
  state: StoreState = storeStateDefault,
  actionWithAnyType: any
) => {
  checkStoreInvariants(state);
  const newState = reduce(state, actionWithAnyType);
  checkStoreInvariants(newState);
  return newState;
};
