import PlayingScreen from '../components/PlayingScreen';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => ({
  myMatches: state.matchesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

const PlayingScreenContainer = connect(mapStateToProps, mapDispatchToProps)(
  PlayingScreen
);

// Redux wrapper for board for game being played in gameportal.
// TODO: Use PlayingScreenContainer at place where the game needs to be displayed
export default PlayingScreenContainer;
