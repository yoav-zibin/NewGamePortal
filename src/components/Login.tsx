import * as React from 'react';

// import { connect } from 'react-redux';
// import { StoreState } from '../types/index';
import * as firebase from 'firebase';
import { PhoneNumberToContact } from '../types/index';
import { ourFirebase } from '../services/firebase';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import RefreshIndicator from 'material-ui/RefreshIndicator';
// import AppBar from 'material-ui/AppBar';

interface Country {
  name: string;
  code: string;
  callingCode: string;
}

interface Props {
  history: any;
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

const testContacts: PhoneNumberToContact = {
  ['+19174021465']: { phoneNumber: '+19174021465', name: 'vivian' },
  ['+15162033600']: { phoneNumber: '+15162033600', name: 'apple' },
  ['+13474529289']: { phoneNumber: '+13474529289', name: 'banana' }
};

const style = {
  margin: 20,
  padding: 10
};

class Login extends React.Component<Props, {}> {
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

  handleChange = (event: any, index: number, value: any) => {
    event = event;
    this.setState({ code: value });
    return index;
  };

  handleInput = (event: any) => {
    if (!event.target.value) {
      this.setState({
        phoneNum: event.target.value,
        errorText: 'This field is required'
      });
    } else {
      this.setState({ phoneNum: event.target.value, errorText: '' });
    }
  };

  handleCodeInput = (event: any) => {
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
  };

  onLogin = () => {
    ourFirebase.init();

    ourFirebase
      .signInWithPhoneNumber(
        this.state.phoneNum,
        this.state.code,
        new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible'
        })
      )
      .then(function(confirmationResult: any) {
        (window as any).confirmationResult = confirmationResult;
      });

    this.setState({ veriDisabled: false });
  };
  // TODO:set time out remove
  sendCode = () => {
    let confirmationResult = (window as any).confirmationResult;
    confirmationResult
      .confirm(this.state.veriCode)
      .then((result: any) => {
        /// User signed in successfully.
        var user = result.user;
        ourFirebase.writeUser();
        ourFirebase.storeContacts(testContacts);
        console.log(user);
        this.props.history.push('/');
      })
      .catch((error: any) => {
        // User couldn't sign in (bad verification code?)
        // ...
        console.log(error);
      });
    this.setState({ status: loadingType.loading });
  };

  render() {
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
export default Login;
