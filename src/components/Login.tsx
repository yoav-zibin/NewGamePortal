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
import AppBar from 'material-ui/AppBar';

interface Country {
  name: string;
  code: string;
  callingCode: string;
}

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

class Login extends React.Component {
  state = {
    code: '',
    phoneNum: '',
    errorText: ''
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

  onLogin = () => {
    ourFirebase.init();
    if (
      ourFirebase.signInWithPhoneNumber(
        this.state.phoneNum,
        this.state.code,
        new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible'
        })
      )
    ) {
      alert('login success');
      console.log(testContacts);
      // ourFirebase.writeUser();
      // ourFirebase.storeContacts(testContacts);
    } else {
      alert('login failed');
    }
  };

  render() {
    return (
      <div>
        <AppBar
          title="Login"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
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
          <RaisedButton label="Login" primary={true} onClick={this.onLogin} />
        </div>
      </div>
    );
  }
}
export default Login;
