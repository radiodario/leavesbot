var procedural = require('procedural');
var bspline = require('b-spline');
var utils = require('./utils');

var leaf = procedural('leaf')
  .takes('width')
  .takes('height')
  .takes('symmetric')
  .takes('quality')
  .takes('randomicity')
  .provides('color', (leaf) => {
    const cols = [
      '#e0f0d5',
      '#c5e3af',
      '#9ac37b',
      '#72a24e',
      '#54862e'
    ]

    const cherry = [
      //'#501A4E',
      '#C481B6',
      '#FCC3E6',
      '#FCC3E6',
      '#FAF9F5'
    ]
    const rnd = leaf.getRandGen('color');
    //return cherry[rnd.nextInt(0, cherry.length)];
    return cols[rnd.nextInt(0, cols.length)];

  })
  .provides('x1', (leaf) => {
    const rnd = leaf.getRandGen('x1');
    return rnd.nextFloat(0.5, 1);
  })
  .provides('y1', (leaf) => {
    const rnd = leaf.getRandGen('y1');
    return rnd.nextFloat(-0.35, .0);
  })
  .provides('x2', (leaf) => {
    const rnd = leaf.getRandGen('x2');
    return rnd.nextFloat(0.5, 1);
  })
  .provides('y2', (leaf) => {
    const rnd = leaf.getRandGen('y2');
    return rnd.nextFloat(.0, 1);
  })
  // angle from tip to side on right
  .provides('sa', (leaf) => {
    const rnd = leaf.getRandGen('sa');
    return rnd.nextFloat(0.0, Math.PI * 2);
  })
  // angle from origin to side on right
  .provides('sb', (leaf) => {
    const rnd = leaf.getRandGen('sc');
    return rnd.nextFloat(0.0, Math.PI * 2);
  })
  // angle from tip to side on left
  .provides('sc', (leaf) => {
    if (leaf.symmetric) {
      return leaf.sa;
    }
    const rnd = leaf.getRandGen('sc');
    const diff = rnd.nextFloat(-0.05, 0.05);
    return leaf.sa + diff;
  })
  // angle from origin so side on right
  .provides('sd', (leaf) => {
    if (leaf.symmetric) {
      return leaf.sb;
    }
    const rnd = leaf.getRandGen('sd');
    const diff = rnd.nextFloat(-0.1, 0.1);
    return leaf.sb + diff;
  })
  .provides('multiLobe', (leaf) => {
    const rnd = leaf.getRandGen('lobe_type');
    if (rnd.nextFloat(-1, 1) > 0) {
      return true;
    }
    return false;
  })
  .provides('p1', (leaf) => {
    return [0, 0];
  })
  .provides('p2', (leaf) => {
    return [leaf.x1, leaf.y1];
  })
  .provides('p3', (leaf) => {
    return [leaf.x2, leaf.y2];
  })
  .provides('p4', (leaf) => {
    return [0, 1];
  })
  .provides('p5', (leaf) => {
    if (leaf.symmetric) {
      return [-leaf.x2, leaf.y2];
    }
    const rnd = leaf.getRandGen();
    // TODO: make how different the sides should be
    const xDiff = rnd.nextFloat(-0.1, 0.1);
    const yDiff = rnd.nextFloat(-0.1, 0.1);
    return [-leaf.x2 + xDiff, leaf.y2 + yDiff];
  })
  .provides('p6', (leaf) => {
    if (leaf.symmetric) {
      return [-leaf.x1, leaf.y1];
    }
    const rnd = leaf.getRandGen();
    // TODO: make how different the sides should be
    const xDiff = rnd.nextFloat(-0.1, 0.1);
    const yDiff = rnd.nextFloat(-0.1, 0.1);
    return [-leaf.x1 + xDiff, leaf.y1 + yDiff];
  })
  .provides('t1', (leaf) => {
    return [Math.sin(leaf.sb), Math.cos(leaf.sb)];
  })
  .provides('t2', (leaf) => {
    return [1, 0];
  })
  .provides('t3', (leaf) => {
    return [0, 1];
  })
  .provides('t4', (leaf) => {
    return [-Math.sin(leaf.sa), Math.cos(leaf.sa)];
  })
  .provides('t5', (leaf) => {
    return [Math.sin(leaf.sc), Math.cos(leaf.sc)];
  })
  .provides('t6', (leaf) => {
    return [0, 1]; // same as t2
  })
  .provides('t7', (leaf) => {
    return [1, 0]; // same as t2
  })
  .provides('t8', (leaf) => {
    return [-Math.sin(leaf.sd), Math.cos(leaf.sd)];
  })
  .provides('ps_r', (leaf) => {
    return [
      leaf.p1,
      leaf.p2,
      leaf.p3,
      leaf.p4,
    ];
  })
  .provides('ps_l', (leaf) => {
    return [
      leaf.p1,
      leaf.p6,
      leaf.p5,
      leaf.p4
    ]
  })
  .provides('D_r', (leaf) => {
    return utils.chordLength(leaf.ps_r);
  })
  .provides('D_l', (leaf) => {
    return utils.chordLength(leaf.ps_l);
  })
  .provides('us_r', (leaf) => {
    const ps = leaf.ps_r;

    return [
      0,
      utils.distance(ps[1], ps[0])/leaf.D_r,
      utils.distance(ps[2], ps[1])/leaf.D_r,
      1
    ]
  })
  .provides('us_l', (leaf) => {
    const ps = leaf.ps_r;

    return [
      0,
      utils.distance(ps[1], ps[0])/leaf.D_l,
      utils.distance(ps[2], ps[1])/leaf.D_l,
      1
    ];
  })
  .provides('knots_r', (leaf) => {
    return [
      0, 0, 0,
      leaf.us_r[1] / 2,
      leaf.us_r[1],
      (leaf.us_r[1] + 1) / 2,
      1, 1, 1
    ];
  })
  .provides('knots_l', (leaf) => {
    return [
      0, 0, 0,
      leaf.us_l[1] / 2,
      leaf.us_l[1],
      (leaf.us_l[1] + 1) / 2,
      1, 1, 1
    ];
  })
  .provides('side_r', (leaf) => {
    const points = leaf.ps_r;
    const knots = [
      0, 0, 0, 1, 2, 2, 2
    ];
    const sampled_points = [];
    const hw = leaf.width;
    const hh = leaf.height;
    for (var i = 0, l = leaf.quality; i < 1; i += (1/l)) {
      const sp = bspline(i, 3, points, knots);
      sampled_points.push([
        hw/2 + sp[0] * hw,
        hh - sp[1] * hh
      ]);
    }

    return sampled_points
  })
  .provides('side_l', (leaf) => {
    const points = leaf.ps_l;
    const knots = [
      0, 0, 0, 1, 2, 2, 2
    ];
    const sampled_points = [];
    const hw = leaf.width;
    const hh = leaf.height;
    for (var i = 0, l = leaf.quality; i < 1; i += (1/l)) {
      const sp = bspline(i, 3, points, knots);
      sampled_points.push([
        hw/2 + sp[0] * hw,
        hh - sp[1] * hh
      ]);
    }

    return sampled_points
  });

module.exports = leaf;
