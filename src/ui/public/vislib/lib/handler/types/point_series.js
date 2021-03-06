import VislibComponentsZeroInjectionInjectZerosProvider from 'ui/vislib/components/zero_injection/inject_zeros';
import VislibLibHandlerHandlerProvider from 'ui/vislib/lib/handler/handler';
import VislibLibDataProvider from 'ui/vislib/lib/data';
import VislibLibXAxisProvider from 'ui/vislib/lib/x_axis';
import VislibLibYAxisProvider from 'ui/vislib/lib/y_axis';
import VislibLibAxisTitleProvider from 'ui/vislib/lib/axis_title';
import VislibLibChartTitleProvider from 'ui/vislib/lib/chart_title';
import VislibLibAlertsProvider from 'ui/vislib/lib/alerts';

export default function ColumnHandler(Private) {
  var injectZeros = Private(VislibComponentsZeroInjectionInjectZerosProvider);
  var Handler = Private(VislibLibHandlerHandlerProvider);
  var Data = Private(VislibLibDataProvider);
  var XAxis = Private(VislibLibXAxisProvider);
  var YAxis = Private(VislibLibYAxisProvider);
  var AxisTitle = Private(VislibLibAxisTitleProvider);
  var ChartTitle = Private(VislibLibChartTitleProvider);
  var Alerts = Private(VislibLibAlertsProvider);

  /*
   * Create handlers for Area, Column, and Line charts which
   * are all nearly the same minus a few details
   */
  function create(opts) {
    opts = opts || {};

    return function (vis) {
      var isUserDefinedYAxis = vis._attr.setYExtents;
      let data;

      if (opts.zeroFill) {
        data = new Data(injectZeros(vis.data), vis._attr, vis.uiState);
      } else {
        data = new Data(vis.data, vis._attr, vis.uiState);
      }

      return new Handler(vis, {
        data: data,
        axisTitle: new AxisTitle(vis.el, data.get('xAxisLabel'), data.get('yAxisLabel')),
        chartTitle: new ChartTitle(vis.el),
        xAxis: new XAxis({
          el                : vis.el,
          xValues           : data.xValues(),
          ordered           : data.get('ordered'),
          xAxisFormatter    : data.get('xAxisFormatter'),
          expandLastBucket  : opts.expandLastBucket,
          _attr             : vis._attr
        }),
        alerts: new Alerts(vis, data, opts.alerts),
        yAxis: new YAxis({
          el   : vis.el,
          yMin : isUserDefinedYAxis ? vis._attr.yAxis.min : data.getYMin(),
          yMax : isUserDefinedYAxis ? vis._attr.yAxis.max : data.getYMax(),
          yAxisFormatter: data.get('yAxisFormatter'),
          _attr: vis._attr
        })
      });

    };
  }

  return {
    line: create(),

    column: create({
      zeroFill: true,
      expandLastBucket: true
    }),

    area: create({
      zeroFill: true,
      alerts: [
        {
          type: 'warning',
          msg: 'Positive and negative values are not accurately represented by stacked ' +
               'area charts. Either changing the chart mode to "overlap" or using a ' +
               'bar chart is recommended.',
          test: function (vis, data) {
            if (!data.shouldBeStacked() || data.maxNumberOfSeries() < 2) return;

            var hasPos = data.getYMax(data._getY) > 0;
            var hasNeg = data.getYMin(data._getY) < 0;
            return (hasPos && hasNeg);
          }
        },
        {
          type: 'warning',
          msg: 'Parts of or the entire area chart might not be displayed due to null ' +
          'values in the data. A line chart is recommended when displaying data ' +
          'with null values.',
          test: function (vis, data) {
            return data.hasNullValues();
          }
        }
      ]
    })
  };
};
