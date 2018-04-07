import * as React from 'react';

import * as firebase from 'firebase';
import { ourFirebase } from '../services/firebase';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import { History } from 'history';
import { Redirect } from 'react-router';

interface Country {
  name: string;
  code: string;
  callingCode: string;
}

interface Props {
  myUserId: string;
  history: History;
}

enum loadingType {
  loading = 'loading',
  hide = 'hide'
}
// Todo: add all countries
const testCountries: Country[] = [
  {
    name: 'United States',
    code: 'US',
    callingCode: '+1'
  },
  {
    name: 'Brazil',
    code: 'BR',
    callingCode: '+55'
  },
  {
    name: 'China',
    code: 'CN',
    callingCode: '+86'
  },
  {
    name: 'Colombia',
    code: 'CO',
    callingCode: '+57'
  }
];

const style = {
  margin: 20,
  padding: 10
};

class Login extends React.Component<Props, {}> {
  confirmationResult: any = null;
  state = {
    code: '',
    phoneNum: '',
    veriCode: '',
    errorText: '',
    veriErrorText: '',
    confirmationResult: null,
    veriDisabled: true,
    status: loadingType.hide
  };

  handleChange(event: any, index: number, value: any) {
    event = event;
    this.setState({ code: value });
    return index;
  }

  handleInput(event: any) {
    if (!event.target.value) {
      this.setState({
        phoneNum: event.target.value,
        errorText: 'This field is required'
      });
    } else {
      this.setState({ phoneNum: event.target.value, errorText: '' });
    }
  }

  handleCodeInput(event: any) {
    if (!event.target.value) {
      this.setState({
        veriCode: event.target.value,
        veriErrorText: 'This field is required'
      });
    } else {
      this.setState({
        veriCode: event.target.value,
        phoneNum: event.target.value,
        veriErrorText: ''
      });
    }
  }

  onLogin() {
    ourFirebase
      .signInWithPhoneNumber(
        this.state.phoneNum,
        this.state.code,
        new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible'
        })
      )
      .then((_confirmationResult: any) => {
        this.confirmationResult = _confirmationResult;
      });

    this.setState({ veriDisabled: false });
  }

  sendCode() {
    this.confirmationResult
      .confirm(this.state.veriCode)
      .then((result: any) => {
        console.log('User signed in successfully: ', result.user);
        this.goToMainPage();
      })
      .catch((error: any) => {
        // User couldn't sign in (bad verification code?)
        // ...
        console.log(error);
      });
    this.setState({ status: loadingType.loading });
  }

  goToMainPage() {
    this.props.history.push('/');
  }

  render() {
    if (this.props.myUserId) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        <div style={style}>
          <div id="recaptcha-container" />
          <SelectField
            floatingLabelText="Select Country"
            value={this.state.code}
            onChange={this.handleChange}
          >
            {testCountries.map((country: Country) => (
              <MenuItem
                key={country.code}
                value={country.code}
                primaryText={country.name + '(' + country.callingCode + ')'}
              />
            ))}
          </SelectField>
          <br />
          <TextField
            id="phoneNum"
            hintText="Enter your phone number"
            errorText={this.state.errorText}
            onChange={this.handleInput}
          />
          <br />
          <br />
          <RaisedButton
            label="get verification code"
            primary={true}
            onClick={this.onLogin}
          />
          <br />
          <br />
          <TextField
            id="veriCode"
            hintText="Enter your verification code"
            errorText={this.state.veriErrorText}
            onChange={this.handleCodeInput}
            disabled={this.state.veriDisabled}
          />
          <br />
          <br />
          <RaisedButton
            label="Login"
            primary={true}
            onClick={this.sendCode}
            disabled={this.state.veriDisabled}
          />
        </div>
        <RefreshIndicator
          size={50}
          left={window.screen.width / 2}
          top={window.screen.height / 2}
          loadingColor="#FF9800"
          status={this.state.status}
        />
      </div>
    );
  }
}

import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => ({
  myUserId: state.myUser.myUserId
});
export default connect(mapStateToProps)(Login);