// A simple smoke test and benchmark for the generators.

var assert = require('assert');
var xor128 = require('../prng/xor128');
var xorwow = require('../prng/xorwow');
var xs7 = require('../prng/xorshift7');
var xor4096 = require('../prng/xor4096');
var tychei = require('../prng/tychei');
var sr = require('../seedrandom');

describe("XOR-Shift generator test", function() {

var benchmarks = { native: { rand: Math.random, times: [] } };

function test(label, alg, double1, float3, int4, hc, qc, ec, e2c) {
  var fn = alg(1);
  var fn2 = alg('hello.', { state: true });
  benchmarks[label] = {rand: fn.quick, times: []};
  it("should use " + label + " correctly", function() {
    if (double1 != null) assert.equal(fn.double(), double1);
    if (float3 != null) assert.equal(fn.quick(), float3);
    if (int4 != null) assert.equal(fn.int32(), int4);
    assert(fn() > 0);
    assert(fn() < 1);
    assert(fn2() > 0);
    var ss = fn2.state();
    var rs = fn2();
    assert(rs < 1);
    var j, h = 0, q = 0, e = 0, r, p, e2 = 0;
    for (j = 0; j < 1024; ++j) {
      r = fn();
      if (r < 0.5) h += 1;
      if (r < 0.25) q += 1;
      if (r < 0.125) e += 1;
      r2 = fn2();
      if (r2 < 0.125) e2 += 1;
    }
    if (hc !== null) {
      assert.equal(h, hc);
      assert.equal(q, qc);
      assert.equal(e, ec);
      assert.equal(e2, e2c);
      h = q = e = p = 0;
      for (j = 0; j < 1024; ++j) {
        r = fn.double();
        if (r < 0.5) h += 1;
        if (r < 0.25) q += 1;
        if (r < 0.125) e += 1;
        if (fn.int32() >= 0) p += 1;
      }
      // Sanity-check double() and int32.
      assert(h >= 480 && h <= 543, h);
      assert(q >= 226 && q <= 286, q);
      assert(e >= 100 && e <= 156, e);
      assert(e2 >= 100 && e2 <= 156, e2);
      assert(p >= 482 && p <= 543, p);
    }
    var fn3 = alg(0, { state: ss });
    assert.equal(fn3(), rs);
  });
}

test("xor128", xor128,
    0.7963797148975774, 0.22171171731315553, 317177041, 498, 236, 110, 115);
test("xorwow", xorwow,
    0.8178000247146859, 0.8407576507888734, 533150816, 519, 228, 121, 123);
test("xorshift7", xs7,
    0.21241471533241418, 0.9957620368804783, -1678071207, 510, 261, 143, 124);
test("xor4096", xor4096,
    0.1520436450538547, 0.4206166828516871, 1312695376, 496, 241, 113, 142);
test("tychei", tychei,
    0.7389796587542713, 0.9962434568442404, 1808020203, 500, 252, 127, 112);
test("seedrandom", sr,
    0.1776348083296759, 0.2160690303426236, 1397712774, 526, 282, 131, 137);

it("runs benchmarks", function() {
  this.timeout(50000);
  this.slow(10000);
  var n = 1;
  var trials = 10;
  var fn, k, start, end, j, t;
  for (k in benchmarks) {
    fn = benchmarks[k].rand;
    // warmup.
    for (j = 0; j < 1e5; ++j) fn();
  }
  for (t = 0; t < trials; ++t) {
    for (k in benchmarks) {
      fn = benchmarks[k].rand;
      start = +new Date;
      // benchmark.
      for (j = 0; j < n * 1e5; ++j) fn();
      end = +new Date;
      benchmarks[k].times.push(end - start);
    }
  }
  for (k in benchmarks) {
    benchmarks[k].times.sort();
  }
  function fastest(array) {
    return (array[0] + array[1] + array[2] + array[3]) / 4;
  }
  var nativetime = fastest(benchmarks.native.times);
  for (k in benchmarks) {
    var time = fastest(benchmarks[k].times);
    console.log(k+ ': ' + time / n + ' nanoseconds per call, ' +
       (time / nativetime).toFixed(1) + 'x native random.');
  }
});

});
