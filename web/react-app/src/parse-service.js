import { parseConfig } from "./parse-config";

export async function parseLogin(username, password) {
  try {
    // here is the call to Parse server login
    if (username && password) {
      await Parse.User.logIn(username, password, {
        success: function(user) {
         console.log("Logged in: " + user);
         // user_data = user;
         // res.render(__dirname + '/public/views/dashboard.html');
          return true;
        },
        error: function(user, error) {
         console.log("Error: " + error + "\n" + user);
         // res.send('Incorrect credentials mate!');
          return false;
        }
      });
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}
