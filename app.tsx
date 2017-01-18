import * as React from "react";
import * as ReactDOM from "react-dom";
import * as lodash from "lodash";
import * as Chart from "chart.js";
import * as moment from "moment";
import {EventEmitter} from "fbemitter";
import {EventSubscription} from "@types/fbemitter";
import {Dispatcher} from "flux";
const CHANGE_EVENT = "change";

const FETCH_EVENTS_ACTION = "FETCH_EVENTS";

declare let gapi: any;
declare let window: any;
declare var require: any;
require("./app.less");

const tagRegex = /#([\w-]+)/g;
const peopleRegex = /@([\w-]+)/g;
const startQuarter = new Date(2017, 0, 1);

const dispatcher = new Dispatcher();

class Store {
  state: any;
  emitter: any;
  constructor() {
    this.state = {
      events: [],
      fetching: false,
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
      case FETCH_EVENTS_ACTION:
        if (payload.events) {
          this.state.fetching = false;
          this.state.events = payload.events;
        } else {
          this.state.fetching = true;
        }
        this.emitChange();
        break;
    }
  }
}

const store = new Store();
dispatcher.register(store.handleDispatch.bind(store));

function onSuccess(googleUser) {
  console.log("Logged in as: " + googleUser.getBasicProfile().getName());
  gapi.client.load("calendar", "v3", onGoogleCalendarLoaded);
}

function onFailure(error) {
  console.log(error);
}

function updateTags(description, tags) {
  const index = description.indexOf("--autotags:");
  const newTagRow = "--autotags: " + tags;
  if (index >= 0) {
    return description.substring(0, index - 1) + newTagRow;
  } else {
    return description + "\n" + newTagRow;
  }
}

export interface EventItemProps { item: any; }
export interface EventItemState { tags: string; }
class EventItem extends React.Component<EventItemProps, EventItemState> {
  constructor(props) {
    super(props);
    this.state = {
      tags: props.item.metadata.tags.concat(props.item.metadata.people).join(" "),
    };
  }
  async onUpdate() {
    if (!this.state.tags) {
      return;
    }
    console.log(this.props.item.id);
    await gapi.client.calendar.events.update({
      calendarId: "primary",
      eventId: this.props.item.id,
      resource: Object.assign({}, this.props.item, {metadata: null, description: updateTags(this.props.item.description, this.state.tags)}),
    });
    fetchEvents();
  }
  async onDelete() {
    if (!confirm("Are you sure you want to delete item?")) {
      return;
    }
    await gapi.client.calendar.events.delete({
      calendarId: "primary",
      eventId: this.props.item.id,
    });
    fetchEvents();
  }
  render() {
    let start = this.props.item.start.dateTime;
    let end = this.props.item.end.dateTime;
    if (!start) {
      start = this.props.item.start.date;
    }
    if (!end) {
      end = this.props.item.end.date;
    }
    const duration = moment.duration(moment(end).diff(start));
    return (
      <tr>
        <td>
          {this.props.item.summary}
        </td>
        <td>
          {moment(start).format("MM/DD hh:mma")} {duration.hours()}h
        </td>
        <td>
          <input type="text" name="tags" value={this.state.tags} onChange={(e) => this.setState({tags: e.currentTarget.value})}/>
        </td>
        <td>
          <button type="button" className="btn btn-danger" onClick={() => this.onDelete()}>Delete</button>
          <button type="button" className="btn btn-default" onClick={() => this.onUpdate()}>Update</button>
        </td>
      </tr>
    );
  }
}

const EventList = (props) => (
  <table className="table">
    <tbody>
      {props.events.map((ev) => (
        <EventItem key={ev.id} item={ev}></EventItem>
      ))}
    </tbody>
  </table>
);

export interface ReportProps { events: any; }
export interface ReportState { report: any; }
class Report extends React.Component<ReportProps, ReportState> {
  chart: any;
  constructor(props) {
    super(props);
  }
  getReport(props) {
    const instanceReport = lodash.flatten(props.events.map(e => e.metadata.tags)).reduce((result, tag) => {
      result[tag] = result[tag] || 0;
      result[tag] += 1;
      return result;
    }, {});
    return instanceReport;
  }
  componentWillReceiveProps(nextProps) {
    const report = this.getReport(nextProps);
    this.updateChartData(this.chart.data, report);
    this.chart.update();
  }
  updateChartData(data, report) {
    data.labels = Object.keys(report);
    data.datasets = data.datasets || [];
    data.datasets[0] = data.datasets[0] || {};
    data.datasets[0].data = lodash.values(report);
    data.datasets[0].backgroundColor = ["#4D4D4D", "#5DA5DA", "#FAA43A", "#60BD68", "#F17CB0", "#B2912F", "#B276B2", "#DECF3F", "#F15854"];
  }
  componentDidMount() {
    const ctx = document.getElementById("timeTagsChart");
    const data = {};
    const report = this.getReport(this.props);
    this.updateChartData(data, report);
    this.chart = new Chart(ctx, {
      type: "pie",
      data: data,
      options: {
        responsive: false,
      },
    });
  }
  render() {
    const report = this.getReport(this.props);
    return (
      <div className="report">
        <div className="report-table">
          <table className="table">
            <tbody>
              {lodash.map(report, (v,k) => (<tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div className="chart-container">
          <canvas className="report-chart" id="timeTagsChart"></canvas>
        </div>
      </div>
    );
  }
};

export interface MainPageProps {}
export interface MainPageState { events: Object[]; fetching: boolean; }
class MainPage extends React.Component<MainPageProps, MainPageState> {
  listenerToken: EventSubscription;
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      fetching: true,
    };
  }
  componentDidMount() {
    this.listenerToken = store.addChangeListener(this.onStoreChanged);
    fetchEvents();
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
        <EventList events={this.state.events} />
      </div>
    );
  }
}


async function fetchEvents() {
  dispatcher.dispatch({action: FETCH_EVENTS_ACTION});
  const resp = await gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin: startQuarter.toISOString(),
    timeMax: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: "startTime",
  });
  const events = resp.result.items.reverse().map(e => {
    if (!e.description) {
      e.description = "";
    }
    e.metadata = {
      tags: e.description.match(tagRegex) || [],
      people: e.description.match(peopleRegex) || [],
    };
    return e;
  });
  dispatcher.dispatch({action: FETCH_EVENTS_ACTION, status: "success", events});
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
