import './LoginDialog.css';

import React, { ChangeEvent } from 'react';
import { postData } from './Utilities';

export interface LoginDialogProps { baseUrl: string, onLoginSuccess:(xauth:string)=>void }
export interface LoginDialogState { username: string, password: string, loginError:string}

export class LoginDialog extends React.Component<LoginDialogProps, LoginDialogState> {
  


    constructor(props: LoginDialogProps) {
      super(props);

      this.state = {
          username : '',
          password : '',
          loginError : ''
      }

      this.handleUsernameChange = this.handleUsernameChange.bind(this);
      this.handlePasswordChange = this.handlePasswordChange.bind(this);
      this.handleLogin = this.handleLogin.bind(this);
    }

    handleUsernameChange(e:ChangeEvent) {
        this.setState({ username: (e.target as HTMLInputElement).value });
    }

    handlePasswordChange(e:ChangeEvent) {
        this.setState({ password: (e.target as HTMLInputElement).value });
    }

    async handleLogin(): Promise<void> {
        try {
          const r = await postData(this.props.baseUrl + 'login', {
              user: this.state.username,
              password: this.state.password
          });
          const authToken = r.headers.get('exauth');
          if(authToken) {
            this.props.onLoginSuccess(authToken);
          }
          else {
            this.setState({loginError: 'Error; no token sent back' });
          }
        }
        catch(e) {
          this.setState({loginError: 'Error' });
        }
    }

    

    render() {
        return (
            <div className='modalBackground'>
              <div className='dialog'>
                <div>
                  <div>
                    <input type="text" placeholder="Username" onChange={this.handleUsernameChange} />
                  </div>
                  <div>
                    <input type="password" placeholder="Password" onChange={this.handlePasswordChange} />
                  </div>
                  <button onClick={this.handleLogin}>Login</button>
                  <p>{this.state.loginError}</p>
                </div>
              </div>
            </div>
          );
      
    }
  }