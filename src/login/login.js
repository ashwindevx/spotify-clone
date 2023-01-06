import { ACCESS_TOKEN, EXPIRES_IN, TOKEN_TYPE } from "../common";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const APP_URL = import.meta.env.VITE_APP_URL;
// information to be accessed
const scopes =
  "user-top-read user-follow-read playlist-read-private user-library-read";

// user authentication popup fn
const authorizeUser = () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${scopes}&show_dialog=true`;
  window.open(url, "login", "width=800, height=600");
};

// runs once when the /login page is loaded
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-to-spotify");
  loginButton.addEventListener("click", authorizeUser);
});

// fn for setting values in localstorage
window.setItemsInLocalStorage = ({ accessToken, tokenType, expiresIn }) => {
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_TYPE, tokenType);
  localStorage.setItem(EXPIRES_IN, Date.now() + expiresIn * 1000); // added and converted current date with expiresIn value into milliseconds
  window.location.href = APP_URL;
};

// runs after the user has logged in using the spotify's login page
window.addEventListener("load", () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN);

  // redirect to dashboard once accessToken is found
  if (accessToken) {
    window.location.href = `${APP_URL}/dashboard/dashboard.html`;
  }

  // check if the popup is opened and has not been closed
  if (window.opener !== null && !window.opener.closed) {
    window.focus();
    if (window.location.href.includes("error")) {
      window.close();
    }

    // get values from popup url
    const { hash } = window.location;
    const searchParams = new URLSearchParams(hash);
    const accessToken = searchParams.get("#access_token");
    const tokenType = searchParams.get("token_type");
    const expiresIn = searchParams.get("expires_in");

    if (accessToken) {
      window.close();
      // passing values to the page responsible for generating popup i.e login page (see line 23)
      window.opener.setItemsInLocalStorage({
        accessToken,
        tokenType,
        expiresIn,
      });
    } else {
      window.close();
    }
  }
});
