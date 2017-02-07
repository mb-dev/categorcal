import * as React from "react";
import * as Chart from "chart.js";
import * as lodash from "lodash";
import "./report.less";

export interface ReportProps { events: any; }
export interface ReportState { report: any; }
export default class Report extends React.Component<ReportProps, ReportState> {
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
  getPeopleReport(props) {
    const instanceReport = lodash.flatten(props.events.map(e => e.metadata.people)).reduce((result, tag) => {
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
    const tagReport = this.getReport(this.props);
    const peopleReport = this.getPeopleReport(this.props);
    const sortReportProperties = (report) => lodash.chain(report).entries().sortBy(([k,v]) => v).reverse().value();
    return (
      <div className="report">
        <div className="report-table">
          <h2>Tags</h2>
          <table className="table">
            <tbody>
              {sortReportProperties(tagReport).map(([k,v]) => (<tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div className="chart-container">
          <canvas className="report-chart" id="timeTagsChart"></canvas>
        </div>
        <div className="report-table people-report">
          <h2>Friends</h2>
          <table className="table">
            <tbody>
              {sortReportProperties(peopleReport).map(([k,v]) => (<tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
};
