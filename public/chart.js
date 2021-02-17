//jshint esversion: 8
const EmbedSDK =  require('/charts');



const sdk = new EmbedSDK({
  baseUrl: 'https://charts.mongodb.com/charts-ibudget-zqzdh'
});

const chart = sdk.createChart({
  chartId: 'df5582b5-8d8d-45a9-9817-80e7ed5de323',
  width: 600,
  height: 600
});

chart.render($('#chart'));
