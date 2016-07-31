// Description:
//  Post to chatroom AWS-charges per 4 hours.
//
// Dependencies:
//  aws-sdk, cron, date-utils
//
// Configuration:
//  HUBOT_AWS_CHARGE_ENABLE_ROOMS = []
//
// Commands:
//   charge - List charges

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var cloudwatch = new AWS.CloudWatch();
var Cron = require('cron').CronJob;
require('date-utils');

function loadConfig(str) {
  try {
    if (typeof str === 'undefined') return [];
    else return JSON.parse(str);
  } catch (e) {
    return console.error(e);
  }
}

var config = {
  rooms: loadConfig(process.env.HUBOT_AWS_CHARGE_ENABLE_ROOMS)
};

module.exports = function(robot) {

  function getAwsCharge() {
    var services = [
      { name: 'AWSDataTransfer', emoji: ':aws_data_transfer:' },
      { name: 'AWSDirectConnect', emoji: ':aws_direct_connect:' },
      { name: 'AWSSupportBusiness', emoji: ':aws_support_business:' },
      { name: 'AmazonCloudFront', emoji: ':amazon_cloud_front:' },
      { name: 'AmazonEC2', emoji: ':amazon_ec2:' },
      { name: 'AmazonES', emoji: ':amazon_es:' },
      { name: 'AmazonElastiCache', emoji: ':amazon_elasti_cache:' },
      { name: 'AmazonRDS', emoji: ':amazon_rds:' },
      { name: 'AmazonS3', emoji: ':amazon_s3:' },
      { name: 'AmazonSNS', emoji: ':amazon_sns:' },
      { name: 'awskms', emoji: ':aws_kms:' }
    ];

    var et = new Date;
    var st = new Date(et);
    st.setDate(st.getDate() - 1);

    var sumPromis = [ new Promise(function(resolve) {
      var params = {
        StartTime: st, EndTime: et,
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
        Period: 86400,
        Statistics: [ 'Maximum' ],
        Dimensions: [ { Name: 'Currency', Value: 'USD' } ],
        Unit: 'None'
      };
      cloudwatch.getMetricStatistics(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else {
          var cost = data.Datapoints.sort(function(a, b){ return a < b;})[0];
          var d = new Date(cost.Timestamp);
          var date = d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
          resolve({name: 'Sum', emoji: ':aws:', cost: cost.Maximum, time: cost.Timestamp});
        }
      });
    }) ];

    Promise.all(sumPromis.concat(services.map(function(s){
      var params = {
        StartTime: st,
        EndTime: et,
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
        Period: 86400,
        Statistics: [ 'Maximum' ],
        Dimensions: [ { Name: 'Currency', Value: 'USD' }, { Name: 'ServiceName', Value: s.name } ],
        Unit: 'None'
      };

      return new Promise(function(resolve) {
        cloudwatch.getMetricStatistics(params, function(err, data) {
          if (err) {
            console.log(err, err.stack);
            resolve({cost: 'error', time: cost.Timestamp});
          } else {
            var cost = data.Datapoints.sort(function(a, b){ return new Date(a) < new Date(b);})[0];
            resolve({name: s.name, emoji: s.emoji, cost: cost.Maximum, time: cost.Timestamp});
          }
        });
      });
    }))).then(function(results) {
      var x = results.map(function(r){
        return r.emoji + ' *' + new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'USD' }).format(r.cost) + '*'
      });
      robot.send( {room: config.rooms}, x.join(' ') );
    });
  }

  var job = new Cron({
    cronTime: '00 03 2,6,10,14,18,22 * * *',
    start: false,
    timeZone: 'Asia/Tokyo',
    onTick: getAwsCharge
  });
  job.start();

  robot.respond(/charge/g, function(msg){
    getAwsCharge();
  });
};
