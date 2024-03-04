export async function parseLogin(username, password) {
  try {
    // here is the call to Parse server login
    if (username && password) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}
