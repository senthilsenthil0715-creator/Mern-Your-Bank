const FACES = ['f', 'b', 'r', 'l', 't', 'u'];

export default function Background3D() {
  const cubes = Array.from({ length: 7 }, (_, i) => ({
    i,
    size: 34 + ((i * 23) % 46),
    left: (i * 14 + 6) % 94,
    delay: (i * 2.3) % 18,
    dur: 26 + (i % 4) * 6,
  }));
  return (
    <div className="bg3d" aria-hidden="true">
      <div className="orb o1" />
      <div className="orb o2" />
      <div className="floor" />
      {cubes.map((c) => (
        <div
          key={c.i}
          className="cube-wrap"
          style={{ left: `${c.left}%`, animationDelay: `-${c.delay}s`, animationDuration: `${c.dur}s`, '--s': `${c.size}px` }}
        >
          <div className="cube">
            {FACES.map((f) => (
              <span key={f} className={`face ${f}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
