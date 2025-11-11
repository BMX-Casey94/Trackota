import React from "react";
import ReactApexChart from "react-apexcharts";

class LineChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      chartData: [],
      chartOptions: {},
    };
  }

  componentDidMount() {
    const { lineChartData, lineChartOptions } = this.props;

    // Build safe options with defensive defaults
    const safeOptions = { ...lineChartOptions };
    
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

    const safeData = Array.isArray(lineChartData) && lineChartData.length > 0
      ? lineChartData
      : [{ name: "Series", data: [] }];

    this.setState({
      chartData: safeData,
      chartOptions: safeOptions,
    });
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.lineChartData !== this.props.lineChartData ||
      prevProps.lineChartOptions !== this.props.lineChartOptions
    ) {
      const { lineChartData, lineChartOptions } = this.props;

      // Build safe options with defensive defaults
      const safeOptions = { ...lineChartOptions };
      
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

      const safeData = Array.isArray(lineChartData) && lineChartData.length > 0
        ? lineChartData
        : [{ name: "Series", data: [] }];

      this.setState({
        chartData: safeData,
        chartOptions: safeOptions,
      });
    }
  }

  render() {
    let series = Array.isArray(this.state.chartData)
      ? this.state.chartData.map((s) => ({ ...s, data: Array.isArray(s?.data) ? s.data : [] }))
      : [];
    if (!Array.isArray(series) || series.length === 0) {
      series = [{ name: "Series", data: [0] }];
    } else {
      series = series.map((s) => {
        const data = Array.isArray(s.data) && s.data.length ? s.data : [0];
        return { ...s, data };
      });
    }

    const raw = this.state.chartOptions || {};
    const xaxis = raw.xaxis || {};
    const annotations = raw.annotations || {};
    const fill = raw.fill || {};
    const gradient = fill.gradient || {};

    const safeOptions = {
      ...raw,
      xaxis: {
        type: xaxis.type || "numeric",
        categories: Array.isArray(xaxis.categories) && xaxis.categories.length ? xaxis.categories : [0],
        labels: xaxis.labels || { style: { colors: "#c8cfca", fontSize: "10px" } },
        ...xaxis,
      },
      annotations: {
        xaxis: Array.isArray(annotations.xaxis) ? annotations.xaxis : [],
        ...annotations,
      },
      fill: {
        ...fill,
        gradient: {
          stops: Array.isArray(gradient.stops) ? gradient.stops : [],
          ...gradient,
        },
      },
    };

    return (
      <ReactApexChart options={safeOptions} series={series} type="area" width="100%" height="100%" />
    );
  }
}

export default LineChart;
