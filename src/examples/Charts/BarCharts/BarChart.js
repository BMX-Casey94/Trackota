import React, { Component } from "react";
import Chart from "react-apexcharts";

class BarChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartData: [],
      chartOptions: {},
    };
  }

  componentDidMount() {
    const { barChartData, barChartOptions } = this.props;

    // Build safe options with defensive defaults
    const safeOptions = { ...barChartOptions };
    
    // Ensure xaxis.categories is always an array
    if (safeOptions.xaxis) {
      safeOptions.xaxis = {
        ...safeOptions.xaxis,
        categories: Array.isArray(safeOptions.xaxis.categories) ? safeOptions.xaxis.categories : [],
      };
    } else {
      safeOptions.xaxis = { categories: [] };
    }

    // Only add gradient.stops if fill.gradient exists
    if (safeOptions.fill && safeOptions.fill.gradient) {
      safeOptions.fill = {
        ...safeOptions.fill,
        gradient: {
          ...safeOptions.fill.gradient,
          stops: Array.isArray(safeOptions.fill.gradient.stops) ? safeOptions.fill.gradient.stops : [],
        },
      };
    }

    const safeData = Array.isArray(barChartData) && barChartData.length > 0
      ? barChartData.map((s) => ({ ...s, data: Array.isArray(s?.data) ? s.data : [] }))
      : [{ name: "Series", data: [] }];
    this.setState({
      chartData: safeData,
      chartOptions: safeOptions,
    });
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.barChartData !== this.props.barChartData ||
      prevProps.barChartOptions !== this.props.barChartOptions
    ) {
      const { barChartData, barChartOptions } = this.props;

      // Build safe options with defensive defaults
      const safeOptions = { ...barChartOptions };
      
      // Ensure xaxis.categories is always an array
      if (safeOptions.xaxis) {
        safeOptions.xaxis = {
          ...safeOptions.xaxis,
          categories: Array.isArray(safeOptions.xaxis.categories) ? safeOptions.xaxis.categories : [],
        };
      } else {
        safeOptions.xaxis = { categories: [] };
      }

      // Only add gradient.stops if fill.gradient exists
      if (safeOptions.fill && safeOptions.fill.gradient) {
        safeOptions.fill = {
          ...safeOptions.fill,
          gradient: {
            ...safeOptions.fill.gradient,
            stops: Array.isArray(safeOptions.fill.gradient.stops) ? safeOptions.fill.gradient.stops : [],
          },
        };
      }

      const safeData = Array.isArray(barChartData) && barChartData.length > 0
        ? barChartData.map((s) => ({ ...s, data: Array.isArray(s?.data) ? s.data : [] }))
        : [{ name: "Series", data: [] }];
      this.setState({
        chartData: safeData,
        chartOptions: safeOptions,
      });
    }
  }

  render() {
    const series = Array.isArray(this.state.chartData)
      ? this.state.chartData.map((s) => ({ ...s, data: Array.isArray(s?.data) ? s.data : [] }))
      : [];
    const safeOptions = this.state.chartOptions || {};
    if (!safeOptions.xaxis) safeOptions.xaxis = { categories: [] };
    if (!Array.isArray(safeOptions.xaxis.categories)) safeOptions.xaxis.categories = [];
    if (!safeOptions.fill) safeOptions.fill = {};
    if (safeOptions.fill.gradient && !Array.isArray(safeOptions.fill.gradient.stops)) {
      safeOptions.fill.gradient.stops = [];
    }
    return <Chart options={safeOptions} series={series} type="bar" width="100%" height="100%" />;
  }
}

export default BarChart;
