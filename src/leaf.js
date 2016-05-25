var procedural = require('procedural');

var unilobe_without_basal = procedural('unilobe_without_basal')
  .takes('width')
  .takes('height')
  .takes('symmetric')
  .takes('randomicity')
  .provides('x', (leaf) => {
    const rnd = leaf.getRandGen('x')
    return rnd.nextFloat(0.2, 1);
  })
  .provides('y', (leaf) => {
    const rnd = leaf.getRandGen('y')
    return rnd.nextFloat(0, .7);
  })
  // angle from tip to side on right
  .provides('sa', (leaf) => {
    const rnd = leaf.getRandGen('sa')
    return rnd.nextFloat(0.0, Math.PI/2);
  })
  // angle from origin to side on right
  .provides('sb', (leaf) => {
    const rnd = leaf.getRandGen('sc')
    return rnd.nextFloat(0.0, Math.PI/2);
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
  // the total chord length of the right lobe
  .provides('D_r', (leaf) => {
    return chordLength(leaf.ps_r)
  })
  // total chord lenght for the left lobe
  .provides('D_l', (leaf) => {
    return chordLength(leaf.ps_l);
  })
  // parameters
  .provides('us_r', (leaf) => {
    let us = [0];
    for (var i = 1; i < 3; i++) {
      const d = distance(leaf.ps_r[i], leaf.ps_r[i-1]);
      const ui = us[i-1] + (d / leaf.D_r);
      us.push(ui);
    }
    return us;
  })
  .provides('us_l', (leaf) => {
    let us = [0];
    for (var i = 1; i < 3; i++) {
      const d = distance(leaf.ps_l[i], leaf.ps_l[i-1]);
      const ui = us[i-1] + (d / leaf.D_l);
      us.push(ui);
    }
    return us;
  })
  .provides('controlPoints_r', (l) => {
    const us = l.us_r;
    const D = l.D_r;

    return [
      l.p1, //q0
      [
        l.p1[0] + (D * l.t1[0] * (us[1] / 4)), // q1.x
        l.p1[1] + (D * l.t1[1] * (us[1] / 4))  // q1.y
      ],
      [
        l.p2[0] - (D * l.t2[0] * (us[1] / 4)), // q2.x
        l.p2[1] - (D * l.t2[1] * (us[1] / 4))  // q2.y
      ],
      [
        l.p2[0] + (D * l.t2[0] * ((1 - us[1]) / 4)), // q3.x
        l.p2[1] + (D * l.t2[1] * ((1 - us[1]) / 4))  // q3.y
      ],
      [
        l.p3[0] - (D * l.t3[0] * ((1 - us[1]) / 4)), // q4.x
        l.p3[1] - (D * l.t3[1] * ((1 - us[1]) / 4))  // q4.y
      ],
      l.p3 // q5
    ];
  })
  .provides('controlPoints_l', (l) => {
    const us = l.us_l;
    const D = l.D_l;
    return [
      l.p1, //q0
      [
        l.p1[0] + (D * l.t6[0] * (us[1] / 4)), // q1.x
        l.p1[1] + (D * l.t6[1] * (us[1] / 4))  // q1.y
      ],
      [
        l.p4[0] - (D * l.t5[0] * (us[1] / 4)), // q2.x
        l.p4[1] - (D * l.t5[1] * (us[1] / 4))  // q2.y
      ],
      [
        l.p4[0] + (D * l.t5[0] * ((1 - us[1]) / 4)), // q3.x
        l.p4[1] + (D * l.t5[1] * ((1 - us[1]) / 4))  // q3.y
      ],
      [
        l.p3[0] - (D * l.t4[0] * ((1 - us[1]) / 4)), // q4.x
        l.p3[1] - (D * l.t4[1] * ((1 - us[1]) / 4))  // q4.y
      ],
      l.p3
    ]; //.reverse();
  })
  .provides('svgpath', (leaf) => {
    const hw = leaf.width / 2;
    const hh = leaf.height / 2;
    const pts_l = leaf.controlPoints_l.map((p) => {
      return [
        hw + hw * p[0],
        leaf.height - leaf.height * p[1]
      ];
    });
    const pts_r = leaf.controlPoints_r.map((p) => {
      return [
        hw + hw * p[0],
        leaf.height - leaf.height * p[1]
      ];
    });

    const p2 = [
      hw + leaf.p2[0] * hw,
      leaf.height - leaf.p2[1] * leaf.height
    ]

    const p4 = [
      hw + leaf.p4[0] * hw,
      leaf.height - leaf.p4[1] * leaf.height
    ]

    var path = `M ${pts_r[0]}
    Q ${pts_r[2]} ${p2}
    T ${pts_r[5]} Z
    M ${pts_l[0]}
    Q ${pts_l[2]} ${p4}
    T ${pts_l[5]} Z
    `;
    return path;
  })
  .provides('pointspath', (leaf) => {
    const hw = leaf.width / 2;
    const hh = leaf.height;

    const p1 = [
      hw + leaf.p1[0] * hw,
      hh - leaf.p1[1] * hh
    ]

    const p2 = [
      hw + leaf.p2[0] * hw,
      hh - leaf.p2[1] * hh
    ]

    const p3 = [
      hw + leaf.p3[0] * hw,
      hh - leaf.p3[1] * hh
    ]

    const p4 = [
      hw + leaf.p4[0] * hw,
      hh - leaf.p4[1] * hh
    ]

    path = `M ${p1} L ${p2} L ${p3} L ${p4} Z`;


    return path;
  })

  function distance(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function chordLength(ps) {
    let D = 0;
    for (let i = 1; i < ps.length; i++) {
      const p1 = ps[i];
      const p2 = ps[i-1];
      D += distance(p1, p2);
    }
    return D;
  }


module.exports = unilobe_without_basal;
