import * as React from 'react';

import * as firebase from 'firebase';
import { ourFirebase } from '../services/firebase';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import AutoComplete from 'material-ui/AutoComplete';
// import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
// import ContentClear from 'material-ui/svg-icons/content/clear';
import { History } from 'history';
import { Redirect } from 'react-router';
import { connect } from 'react-redux';
import { StoreState, PhoneNumInfo } from '../types/index';

const data = require('../countrycode.json');
require('../js/trans-compiled');
declare function parsePhoneNumber(
  phoneNumber: String,
  regionCode: String
): PhoneNumInfo;

interface Country {
  name: string;
  code: string;
  callingCode: string;
  emojiCode: string;
}

interface Props {
  myUserId: string;
  history: History;
  countries: Country[];
  countryNames: String[];
}

interface DataSourceNode {
  text: string;
  value: object;
}

enum loadingType {
  loading = 'loading',
  hide = 'hide'
}

enum visibilityType {
  visible = 'visible',
  hidden = 'hidden'
}

const style: React.CSSProperties = {
  margin: 20
  // padding: 10
};

class Login extends React.Component<Props, {}> {
  confirmationResult: any = null;

  state = {
    selectField: { value: '', label: '' },
    code: '',
    defaultCode: 'US',
    phoneNum: '',
    veriCode: '',
    errorText: '',
    veriErrorText: '',
    confirmationResult: null,
    veriDisabled: true,
    status: loadingType.hide,
    searchText: '',
    defaultText: 'United States(+1)',
    onSelect: false,
    clearVisibility: visibilityType.visible,
    countries: [],
    countryNames: [],
    loginOnce: false,
  };

  // clearStyle: React.CSSProperties = {
  //   visibility: this.state.clearVisibility
  //  };

  handleClickOutsideSelect = () => {
    if (this.props.countryNames.indexOf(this.state.searchText)) {
      this.setState({
        searchText: this.state.defaultText,
        code: this.state.defaultCode
      });
    }
  };

  handleUpdateInput = (searchText: String) => {
    if (searchText.length > 0) {
      this.setState({
        clearVisibility: visibilityType.visible
      });
    } else {
      this.setState({
        clearVisibility: visibilityType.hidden
      });
    }
    this.setState({
      searchText: searchText
    });
  };

  handleNewRequest = (chosenRequest: DataSourceNode) => {
    if (chosenRequest.text.indexOf('-') !== -1) {
      let searchWords = chosenRequest.text.split('-');
      console.log(searchWords);
      if (this.props.countryNames.indexOf(searchWords[1]) !== -1) {
        this.setState({
          searchText: searchWords[1],
          defaultText: searchWords[1],
          code: searchWords[0],
          defaultCode: searchWords[0]
        });
      } else {
        this.setState({
          searchText: this.state.defaultText,
          code: this.state.defaultCode
        });
      }
    } else {
      this.setState({
        searchText: this.state.defaultText,
        code: this.state.defaultCode
      });
    }
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
    let result = parsePhoneNumber(this.state.phoneNum, this.state.code);
    console.log(result);
    if (result.isValidNumber) {
      this.setState({ loginOnce : true, veriDisabled: false });
      let phoneNumber = result.internationalFormat;
      if(!this.state.loginOnce){
        ourFirebase
        .signInWithPhoneNumber(
          phoneNumber,
          this.state.code,
          new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            size: 'invisible'
          })
        )
        .then((_confirmationResult: any) => {
          this.confirmationResult = _confirmationResult;
        });
      }
     
    } else {
      this.setState({ errorText: 'invalid phone number' });
    }
  };

  sendCode = () => {
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
  };

  goToMainPage = () => {
    this.props.history.push('/');
  };

  render() {
    if (this.props.myUserId) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        <div style={style}>
          <div id="recaptcha-container" />

          <div>
            <AutoComplete
              listStyle={{ maxHeight: 200, overflow: 'auto' }}
              floatingLabelText="Country"
              hintText="Select Country"
              searchText={this.state.searchText}
              onUpdateInput={this.handleUpdateInput}
              onNewRequest={this.handleNewRequest}
              dataSource={this.props.countries.map((country: Country) => ({
                text:
                  country.code +
                  '-' +
                  country.name +
                  '(+' +
                  country.callingCode +
                  ')',
                value: (
                  <MenuItem
                    primaryText={
                      country.name + '(+' + country.callingCode + ')'
                    }
                    secondaryText={country.emojiCode}
                  />
                )
              }))}
              fullWidth={true}
              filter={AutoComplete.fuzzyFilter}
              openOnFocus={true}
            />
          </div>
          <div onClick={this.handleClickOutsideSelect}>
            <br />
            <TextField
              id="phoneNum"
              floatingLabelText="Phone Number"
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
              floatingLabelText="Verification Code"
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
            <RefreshIndicator
              size={50}
              left={window.screen.width / 2}
              top={window.screen.height / 2}
              loadingColor="#FF9800"
              status={this.state.status}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  const countries: Country[] = [];
  const countryNames: String[] = [];
  for (let country of data) {
    const l = country.code.codePointAt(0);
    const r = country.code.codePointAt(1);
    const emoji =
      String.fromCodePoint(l + 127397) + String.fromCodePoint(r + 127397);
    countries.push({
      code: country.code,
      name: country.name,
      callingCode: country.callingCode,
      emojiCode: emoji
    });
    countryNames.push(country.name + '(+' + country.callingCode + ')');
  }
  return {
    myUserId: state.myUser.myUserId,
    countries,
    countryNames
  };
};
export default connect(mapStateToProps)(Login);
