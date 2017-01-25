import * as React from "react";
import * as Chart from "chart.js";
import * as lodash from "lodash";

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
