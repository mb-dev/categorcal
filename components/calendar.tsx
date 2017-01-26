import * as React from "react";
import * as lodash from "lodash";
import * as moment from "moment";
import "./calendar.less";

moment.locale("en", {week: {dow: 1, doy: 1}});

function getFirstVisualDay(year, month) {
  return moment({year, month, day: 1}).startOf("week").toDate();
}
function getLastVisualDay(year, month) {
  return moment({year, month, day: 1}).endOf("month").endOf("week").toDate();
}
function getWeeksBetweenDates(date1, date2) {
  return Math.ceil(moment.duration(date2.getTime() - date1.getTime()).asWeeks());
}

const CalendarQuarter = (props) => {
  const eventsByDate = props.events;
  const month = parseInt(props.month, 10);
  const year = parseInt(props.year, 10);
  const firstDate = getFirstVisualDay(year, month);
  console.log(firstDate);
  const lastDate = getLastVisualDay(year, month);
  const weeksInMonth = getWeeksBetweenDates(firstDate, lastDate);
  const currentDate = firstDate;
  currentDate.setDate(currentDate.getDate() - 1);
  const rows = lodash.times(weeksInMonth).map(week => (
    <tr key={week}>
      {lodash.times(7).map((day) => {
        currentDate.setDate(currentDate.getDate() + 1);
        const dateKey = moment(currentDate).format("YYYY-MM-DD");
        return (
          <td key={day} className={moment(currentDate).format("ddd")}>
            <span className="day">{moment(currentDate).format("DD")}</span>
            {currentDate.getMonth() === month && 
              <ul>
                {eventsByDate[dateKey] && eventsByDate[dateKey].map(e => (
                  e.metadata.tags.map(t => (<li>{t}</li>))
                ))}
              </ul>
            }
          </td>
        );
      })}
    </tr>
  ));
  return (
    <div className="calendar-quarter">
      <h3>{moment({year, month, day: 1}).format("MMM")}</h3>
      <table className="table">
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
};

const Calendar = (props) => {
  const eventsWithTags = lodash(props.events)
    .chain()
    .filter(e => e.metadata.tags.length > 0)
    .groupBy(e => e.metadata.date)
    .value();

  return (
    <div className="calendar">
      <CalendarQuarter year="2017" month="0" events={eventsWithTags} />
      <CalendarQuarter year="2017" month="1" events={eventsWithTags} />
      <CalendarQuarter year="2017" month="2" events={eventsWithTags} />
    </div>
  );
};
export default Calendar;
