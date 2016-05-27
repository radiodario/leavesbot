var procedural = require('procedural');
var bspline = require('b-spline');
var utils = require('./utils');

var unilobe_without_basal = procedural('unilobe_without_basal')
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
  .provides('x', (leaf) => {
    const rnd = leaf.getRandGen('x')
    return rnd.nextFloat(0.5, 1);
  })
  .provides('y', (leaf) => {
    const rnd = leaf.getRandGen('y')
    return rnd.nextFloat(0, .6);
  })
  // angle from tip to side on right
  .provides('sa', (leaf) => {
    const rnd = leaf.getRandGen('sa')
    return rnd.nextFloat(0.0, Math.PI * 2);
  })
  // angle from origin to side on right
  .provides('sb', (leaf) => {
    const rnd = leaf.getRandGen('sc')
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
  .provides('p1', (leaf) => {
    return [0, 0];
  })
  .provides('p2', (leaf) => {
    return [leaf.x, leaf.y]
  })
  .provides('p3', (leaf) => {
    return [0, 1];
  })
  .provides('p4', (leaf) => {
    if (leaf.symmetric) {
      return [-leaf.x, leaf.y];
    }
    const rnd = leaf.getRandGen();
    // TODO: make how different the sides should be
    const xDiff = rnd.nextFloat(-0.1, 0.1);
    const yDiff = rnd.nextFloat(-0.1, 0.1);
    return [-leaf.x + xDiff, leaf.y + yDiff];
  })
  .provides('t1', (leaf) => {
    return [Math.sin(leaf.sb), Math.cos(leaf.sb)];
  })
  .provides('t2', (leaf) => {
    return [0, 1];
  })
  .provides('t3', (leaf) => {
    return [-Math.sin(leaf.sa), Math.cos(leaf.sa)];
  })
  .provides('t4', (leaf) => {
    return [Math.sin(leaf.sc), Math.cos(leaf.sc)];
  })
  .provides('t5', (leaf) => {
    return [0, 1]; // same as t2
  })
  .provides('t6', (leaf) => {
    return [-Math.sin(leaf.sd), Math.cos(leaf.sd)];
  })
  .provides('ps_r', (leaf) => {
    return [
      leaf.p1, leaf.p2, leaf.p3
    ];
  })
  .provides('ps_l', (leaf) => {
    return [
      leaf.p1, leaf.p4, leaf.p3
    ]
  })
  .provides('points_r', (leaf) => {
    return [
      leaf.p1,
      leaf.t1,
      leaf.p2,
      leaf.t2,
      leaf.p3,
      leaf.t3
    ]
  })
  .provides('points_l', (leaf) => {
    return [
      leaf.p1,
      leaf.t6,
      leaf.p4,
      leaf.t5,
      leaf.p3,
      leaf.t3
    ]
  })
  // the total chord length of the right lobe
  .provides('D_r', (leaf) => {
    return utils.chordLength(leaf.ps_r)
  })
  // total chord lenght for the left lobe
  .provides('D_l', (leaf) => {
    return utils.chordLength(leaf.ps_l);
  })
  // parameters
  .provides('us_r', (leaf) => {
    let us = [0];
    for (var i = 1; i < 3; i++) {
      const d = utils.distance(leaf.points_r[i], leaf.points_r[i-1]);
      const ui = us[i-1] + (d / leaf.D_r);
      us.push(ui);
    }
    return us;
  })
  .provides('us_l', (leaf) => {
    let us = [0];
    for (var i = 1; i < 3; i++) {
      const d = utils.distance(leaf.points_l[i], leaf.points_l[i-1]);
      const ui = us[i-1] + (d / leaf.D_l);
      us.push(ui);
    }
    return us;
  })
  .provides('knots_r', (leaf) => {
    let vs = [0, 0, 0]
    let n = leaf.ps_r.length;
    for (var j = 1; j < n - 2 ; j++) {
      vs[j+2] = 1;
    }
    vs = vs.concat([2, 2, 2]);
    return vs;
  })
  .provides('side_l', (leaf) => {
    const points = leaf.ps_l;
    const knots = [
      0, 0, 0, 2, 2, 2
    ];
    const sampled_points = [];
    const hw = leaf.width; // / 2;
    const hh = leaf.height;
    for (var i = 0, l = leaf.quality; i < 1; i += (1/l)) {
      const sp = bspline(i, 3, points, knots);
      sampled_points.push([
        hw/2 + sp[0] * hw,
        hh - sp[1] * hh
      ]);
    }

    return sampled_points;
  })
  .provides('side_r', (leaf) => {
    const points = leaf.ps_r;
    const knots = [
      0, 0, 0, 2, 2, 2
    ];
    const sampled_points = [];
    const hw = leaf.width;// / 2;
    const hh = leaf.height;
    for (var i = 0, l = leaf.quality; i < 1; i += (1/l)) {
      const sp = bspline(i, 3, points, knots);
      sampled_points.push([
        hw/2 + sp[0] * hw,
        hh - sp[1] * hh
      ]);
    }


    return sampled_points;
  });


module.exports = unilobe_without_basal;
