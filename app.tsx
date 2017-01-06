import * as React from "react";
import * as ReactDOM from "react-dom";
import * as lodash from "lodash";
import * as Chart from "chart.js";
import {Dispatcher} from "flux";

declare let gapi: any;
declare let window: any;

const tagRegex = /#([\w-]+)/g;
const peopleRegex = /@([\w-]+)/g;
const startQuarter = new Date(2017, 0, 1);

const store = {};
function onChange() {

}

function onSuccess(googleUser) {
  console.log("Logged in as: " + googleUser.getBasicProfile().getName());
  gapi.client.load("calendar", "v3", listUpcomingEvents);
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
  }
  async onDelete() {
    if (!confirm("Are you sure you want to delete item?")) {
      return;
    }
    await gapi.client.calendar.events.delete({
      calendarId: "primary",
      eventId: this.props.item.id,
    });
    listUpcomingEvents();
  }
  render() {
    let when = this.props.item.start.dateTime;
    if (!when) {
      when = this.props.item.start.date;
    }
    return (
      <tr>
        <td>
          {this.props.item.summary}
        </td>
        <td>
          {when}
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
        <EventItem item={ev}></EventItem>
      ))}
    </tbody>
  </table>
);

export interface ReportProps { events: any; }
export interface ReportState { report: any; }
class Report extends React.Component<ReportProps, ReportState> {
  constructor(props) {
    super(props);
    const instanceReport = lodash.flatten(props.events.map(e => e.metadata.tags)).reduce((result, tag) => {
      result[tag] = result[tag] || 0;
      result[tag] += 1;
      return result;
    }, {});
    this.state = {report: instanceReport};
  }
  componentDidMount() {
    const ctx = document.getElementById("timeTagsChart");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(this.state.report),
        datasets: [{
          data: lodash.values(this.state.report),
          backgroundColor: ["red", "yellow"],
        }],
      },
      options: {
        responsive: false,
      },
    });
  }
  render() {
    return (
      <div>
        <table className="table">
          <tbody>
            {lodash.map(this.state.report, (v,k) => (<tr>
              <td>{k}</td>
              <td>{v}</td>
            </tr>))}
          </tbody>
        </table>
        <canvas id="timeTagsChart" width="400" height="400"></canvas>
      </div>
    );
  }
};

const MainPage = (props) => (
  <div className="main-page">
    <h2>Report</h2>
    <Report events={props.events} />
    <h2>Events List</h2>
    <EventList events={props.events} />
  </div>
);


async function listUpcomingEvents() {
  const resp = await gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin: startQuarter.toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: "startTime",
  });
  const events = resp.result.items.map(e => {
    if (!e.description) {
      e.description = "";
    }
    e.metadata = {
      tags: e.description.match(tagRegex) || [],
      people: e.description.match(peopleRegex) || [],
    };
    return e;
  });

  if (events.length > 0) {
    ReactDOM.render(<MainPage events={events}/>, document.getElementById("categorcal-placeholder"));
  } else {
    ReactDOM.render(<div>No upcoming events found.</div>, document.getElementById("categorcal-placeholder"));
  }
}

window.renderButton = function() {
  gapi.signin2.render("g-signin2", {
    scope: "profile email https://www.googleapis.com/auth/calendar",
    theme: "dark",
    onsuccess: onSuccess,
    onfailure: onFailure
  });
};
