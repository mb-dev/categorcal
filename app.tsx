import * as React from "react";
import * as ReactDOM from "react-dom";
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
  const index = (description || "").indexOf("--autotags:");
  const newTagRow = "--autotags: " + tags;
  if (index >= 0) {
    return description.substring(0, index - 1) + newTagRow;
  } else {
    return (description || "") + "\n" + newTagRow;
  }
}

export interface EventItemProps { item: any; }
export interface EventItemState { tags: string; }
class EventItem extends React.Component<EventItemProps, EventItemState> {
  constructor(props) {
    super(props);
    const tags = (props.item.description || "").match(tagRegex) || [];
    const people = (props.item.description || "").match(peopleRegex) || [];
    this.state = {
      tags: tags.concat(people).join(" "),
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
      resource: Object.assign({}, this.props.item, {description: updateTags(this.props.item.description, this.state.tags)}),
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


async function listUpcomingEvents() {
  const resp = await gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin: startQuarter.toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: "startTime",
  });
  const events = resp.result.items;

  if (events.length > 0) {
    ReactDOM.render(<EventList events={events}/>, document.getElementById("categorcal-placeholder"));
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
