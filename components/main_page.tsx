import * as React from "react";
import store from "../store/store";
import actions from "../actions/actions";
import Report from "./report";
import EventList from "./event_list";
import {EventSubscription} from "@types/fbemitter";

interface MainPageProps {}
interface MainPageState { events: Object[]; fetching: boolean; allPeople: string[], allTags: string[]; }
export default class MainPage extends React.Component<MainPageProps, MainPageState> {
  listenerToken: EventSubscription;
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      fetching: true,
      allPeople: [],
      allTags: [],
    };
  }
  componentDidMount() {
    this.listenerToken = store.addChangeListener(this.onStoreChanged);
    actions.fetchEvents();
  }
  componentWillUnmount() {
    this.listenerToken.remove();
  }
  onStoreChanged = () => {
    this.updateState(this.props);
  }
  updateState(props) {
    this.setState({
      events: store.state.events,
      fetching: store.state.fetching,
      allPeople: store.state.allPeople,
      allTags: store.state.allTags,
    });
  }

  render() {
    if (this.state.events.length === 0 && this.state.fetching) {
      return (<div>Loading...</div>);
    }

    if (this.state.events.length === 0) {
      return (<div>No upcoming events found.</div>);
    }
    return (
      <div className="main-page">
        <h2>Report</h2>
        <Report events={this.state.events} />
        <h2>Events List</h2>
        <EventList events={this.state.events} allPeople={this.state.allPeople} allTags={this.state.allTags} />
      </div>
    );
  }
}

