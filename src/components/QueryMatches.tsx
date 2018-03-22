import * as React from 'react';
import '../App.css';

import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import AddMatches from '../components/AddMatches';

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

const AddMatchesContainer = connect(mapStateToProps, mapDispatchToProps)(
  AddMatches
);

class QueryMatches extends React.Component {
  render() {
    return <AddMatchesContainer />;
  }
}

export default QueryMatches;
