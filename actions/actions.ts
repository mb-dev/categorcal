import * as lodash from "lodash";
import * as moment from "moment";
import dispatcher from "../dispatcher/dispatcher";
import * as actionTypes from "../store/action_types";

declare let gapi: any;
const startQuarter = new Date(2017, 0, 1);
const tagRegex = /#([\w-]+)/g;
const peopleRegex = /@([\w-]+)/g;

class Actions {
  async fetchEvents() {
    dispatcher.dispatch({action: actionTypes.FETCH_EVENTS_ACTION});
    const resp = await gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: startQuarter.toISOString(),
      timeMax: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: "startTime",
    });
    const events = lodash.chain(resp.result.items).map(e => {
      if (!e.description) {
        e.description = "";
      }
      let start = e.start.dateTime;
      let end = e.end.dateTime;
      if (!start) {
        start = e.start.date;
      }
      if (!end) {
        end = e.end.date;
      }
      e.metadata = {
        tags: e.description.match(tagRegex) || [],
        people: e.description.match(peopleRegex) || [],
        start,
        end,
        date: moment(start).format("YYYY-MM-DD"),
      };
      return e;
    })
    .orderBy(["metadata.date", "metadata.start"], ["desc", "asc"]).value();
    const allTags = lodash.uniq(lodash.flatMap(events, e => e.metadata.tags));
    const allPeople = lodash.uniq(lodash.flatMap(events, e => e.metadata.people));
    dispatcher.dispatch({action: actionTypes.FETCH_EVENTS_ACTION, status: "success", events, allTags, allPeople});
  }
}

const actions = new Actions();
export default actions;
