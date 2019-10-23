const Benchmark = require('benchmark');
const path = require('path');

const scan5 = require('../dist/es2015');
const totalist = require('totalist');


function toStringBench() {
  var bench = this,
    hz = bench.hz,
    stats = bench.stats,
    size = stats.sample.length,
    pm = '\xb1',
    result = bench.name + new Array(16 - bench.name.length).join(' '),
    n = "" + hz.toFixed(2);

  n = new Array(16 - n.length).join(' ') + n;

  result += ' x ' + n + ' ops/sec ' + pm +
    stats.rme.toFixed(2) + '% (' + size + ' run' + (size === 1 ? '' : 's') + ' sampled)';

  return result;
}


const TARGET = path.resolve(path.join(__dirname, '..'));
console.log('scanning for ', TARGET);


let totalResult = 0;
let scan5Result = 0;

const RGX = /\.js$/;

new Benchmark.Suite({
  defer: true,
})
  .add('totalist', {
    defer: true,
    fn: async (deferred) => {
      const list = [];
      await totalist(TARGET, name => {
        if (RGX.test(name)) {
          list.push(name)
        }
      });
      totalResult = list.length;

      deferred.resolve();
    }
  })
  .add('scan5', {
    defer: true,
    fn: async (deferred) => {
      scan5Result = (
        await scan5.default(TARGET, (name) => RGX.test(name), () => false)
      ).length;

      deferred.resolve();
    }
  })
  .on('cycle', function (event) {
    console.log(toStringBench.call(event.target));
  })
  .on('complete', function () {
    console.log({totalResult, scan5Result});
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })

  .run();
