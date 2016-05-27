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

module.exports = {
  chordLength : chordLength,
  distance: distance
}
