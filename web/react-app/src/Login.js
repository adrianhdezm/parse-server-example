   // Login.js
   import React, { useState } from 'react';
   import Parse from 'parse';
   import parseConfig from './parseConfig';

   Parse.setAsyncStorage(window.localStorage);

   const Login = () => {
     const [username, setUsername] = useState('');
     const [password, setPassword] = useState('');

     const handleLogin = async () => {
       try {
         await Parse.User.logIn(username, password);
         console.log('Login successful!');
       } catch (error) {
         console.error('Login failed:', error);
       }
     };

     return (
       <div>
         <h2>Login</h2>
         <label>
           Username:
           <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
         </label>
         <label>
           Password:
           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
         </label>
         <button onClick={handleLogin}>Login</button>
       </div>
     );
   };

   export default Login;
