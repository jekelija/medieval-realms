import './LoginDialog.css';

import React, { ChangeEvent } from 'react';

export interface LoginDialogProps { baseUrl: string, onLoginSuccess:()=>void }
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
          await this.postData(this.props.baseUrl + 'login', {
              user: this.state.username,
              password: this.state.password
          });
          this.props.onLoginSuccess();
        }
        catch(e) {
          console.log(e);
          this.setState({loginError: 'Error' });
        }
      

    }

    async postData(url:string, data:any = {}): Promise<any> {
      // Default options are marked with *
      const response = await fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        });
      const txt = await response.text();
      return txt ? JSON.parse(txt) : {};
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