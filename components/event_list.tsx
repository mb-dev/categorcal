import * as React from "react";
import EventItem from "./event_item";

let lastDate = null;
let lastClass = "even";
function cycle(date) {
  if (!lastDate) {
    lastDate = date;
    return lastClass;
  }
  if (lastDate !== date) {
    lastClass = lastClass === "even" ? "odd" : "even";
    lastDate = date;
  }
  return lastClass;
}

const EventList = (props) => {
  lastDate = null;
  lastClass = "even";
  return (
    <table className="table event-list">
      <tbody>
        {props.events.map((ev) => (
          <EventItem className={cycle(ev.metadata.date)} key={ev.id} item={ev} allTags={props.allTags} allPeople={props.allPeople}></EventItem>
        ))}
      </tbody>
    </table>
  );
};
export default EventList;
