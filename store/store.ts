import {EventEmitter} from "fbemitter";
import * as actionTypes from "./action_types";

const CHANGE_EVENT = "change";

class Store {
  state: any;
  emitter: any;
  constructor() {
    this.state = {
      events: [],
      fetching: false,
      allPeople: [],
      allTags: [],
    };
    this.emitter = new EventEmitter();
  }
  emitChange() {
    this.emitter.emit(CHANGE_EVENT);
  }
  addChangeListener(callback) {
    return this.emitter.addListener(CHANGE_EVENT, callback);
  }
  handleDispatch(payload) {
    switch (payload.action) {
      case actionTypes.FETCH_EVENTS_ACTION:
        if (payload.events) {
          this.state.fetching = false;
          this.state.events = payload.events;
          this.state.allPeople = payload.allPeople;
          this.state.allTags = payload.allTags;
        } else {
          this.state.fetching = true;
        }
        this.emitChange();
        break;
    }
  }
}

const store = new Store();
export default store;

