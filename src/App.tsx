import * as React from 'react';
import './App.css';

import AppHeader from './AppHeader';
import GamesList from './components/GamesList';

interface AppProps {
  fetchList: any;
}

class App extends React.Component<AppProps> {

  constructor(props: AppProps) {
    super(props);
  }
  render() {
    return (
      <div>
        <AppHeader />
        <GamesList fetchList={this.props.fetchList} />
      </div>
    );
  }
}

export default App;