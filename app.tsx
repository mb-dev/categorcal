import * as React from "react";
import * as ReactDOM from "react-dom";
import store from "./store/store";
import dispatcher from "./dispatcher/dispatcher";
import MainPage from "./components/main_page";

declare let gapi: any;
declare let window: any;
declare var require: any;

import "./app.less";
import "react-tagsinput/react-tagsinput.css";


dispatcher.register(store.handleDispatch.bind(store));

function onSuccess(googleUser) {
  console.log("Logged in as: " + googleUser.getBasicProfile().getName());
  gapi.client.load("calendar", "v3", onGoogleCalendarLoaded);
}

function onFailure(error) {
  console.log(error);
}


function onGoogleCalendarLoaded() {
  ReactDOM.render(<MainPage/>, document.getElementById("categorcal-placeholder"));
}

window.renderButton = function() {
  gapi.signin2.render("g-signin2", {
    scope: "profile email https://www.googleapis.com/auth/calendar",
    theme: "dark",
    onsuccess: onSuccess,
    onfailure: onFailure
  });
};
