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
require('../js/trans-compiled');
const data = require('../countrycode.json');

declare function isValidNumber(phoneNumber:String,regionCode:String):boolean;
declare function phoneNumberParser(phoneNumber:String,regionCode:String):string;

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
  margin: 20,
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
    defaultText:'United States(+1)',
    onSelect: false,
    clearVisibility: visibilityType.visible,
    countries:[],
    countryNames: []
  };

  // clearStyle: React.CSSProperties = {
  //   visibility: this.state.clearVisibility
 //  };

  handleClickOutsideSelect = () =>{
    if(this.props.countryNames.indexOf(this.state.searchText)){
      this.setState({
        searchText: this.state.defaultText,
        code: this.state.defaultCode
      });
    }
  }

  handleUpdateInput = (searchText: String) => {
    if(searchText.length > 0){
      this.setState({
        clearVisibility: visibilityType.visible,
      });
    }else{
      this.setState({
        clearVisibility: visibilityType.hidden,
      });
    }
    this.setState({
      searchText: searchText,
    });
  };

  handleNewRequest = (chosenRequest: DataSourceNode) => {
    let searchWords = chosenRequest.text.split("-");
    if(this.props.countryNames.indexOf(searchWords[1]) !== -1){
      this.setState({
        searchText: searchWords[1],
        defaultText: searchWords[1],
        code: searchWords[0],
        defaultCode: searchWords[0]
      });
    }else{
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
    if(isValidNumber(this.state.phoneNum,this.state.code)){
      let phoneNumber = phoneNumberParser(this.state.phoneNum,this.state.code);
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

      this.setState({ veriDisabled: false });
    }else{
      // TODO: use react materiale UI instead of alert.
      alert("invalid phone number")
      this.setState({errorText: "invalid phone number"})
    }
  }

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

  // todo: change listStyle in Autocomplete(some countries' names are too long to show)
  
  // TODO: click on the autoComplete should immediately do the action, i.e., either 
  // addParticipant or sendSMS (instead of filtering the contacts list).
  render() {
    if (this.props.myUserId) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        <div style={style} >
          <div id="recaptcha-container" />

          <div>
          <AutoComplete
            floatingLabelText="Country"
            hintText="Select Country"
            searchText={this.state.searchText}
            onUpdateInput={this.handleUpdateInput}
            onNewRequest={this.handleNewRequest}
            dataSource={this.props.countries.map((country: Country) =>({
              text: country.code+"-"+country.name+"(+"+country.callingCode+")",
              value: (
                      <MenuItem
                        primaryText={country.name+"(+"+country.callingCode+")"} 
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

import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => {
  const countries: Country[] = [];
  const countryNames: String[] = [];
  for(let country of data){
    const l = (country.code).codePointAt(0);
    const r = (country.code).codePointAt(1);
    const emoji = String.fromCodePoint(l + 127397)+String.fromCodePoint(r + 127397);
    countries.push({code:country.code, name: country.name, callingCode: country.callingCode, emojiCode:emoji});
    countryNames.push(country.name+"(+"+country.callingCode+")");
  }
  return {
    myUserId: state.myUser.myUserId,
    countries,
    countryNames
  };
};
export default connect(mapStateToProps)(Login);
