import * as React from 'react';
import MatchesList from './MatchesList';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => ({
  matchesList: state.matchesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

const MatchesListContainer = connect(mapStateToProps, mapDispatchToProps)(
  MatchesList
);

class ViewMatches extends React.Component {
  render() {
    return <MatchesListContainer />;
  }
}

export default ViewMatches;
