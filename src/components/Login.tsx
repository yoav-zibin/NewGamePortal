import * as React from 'react';

// import { connect } from 'react-redux';
// import { StoreState } from '../types/index';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import AppBar from 'material-ui/AppBar';

const style = {
  margin: 20,
  padding: 10
};

class Login extends React.Component {
  state = {
    value: +1
  };

  handleChange = (event: any, index: number, value: any) => {
    event = event;
    this.setState({ value });
    return index;
  };
  render() {
    return (
      <div>
        <AppBar
          title="Login"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <div style={style}>
          <SelectField
            floatingLabelText="Select Country"
            value={this.state.value}
            onChange={this.handleChange}
          >
            <MenuItem value={+1} primaryText="United States(+1)" />
            <MenuItem value={2} primaryText="Japan" />
            <MenuItem value={3} primaryText="Canada" />
            <MenuItem value={+86} primaryText="China(+86)" />
            <MenuItem value={5} primaryText="India" />
          </SelectField>
          <br />
          <TextField hintText="Enter your phone number" errorText="" />
          <br />
          <br />
          <RaisedButton label="Login" primary={true} />
        </div>
      </div>
    );
  }
}
export default Login;
