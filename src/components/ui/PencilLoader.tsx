import { useEffect, useRef } from 'react';

export default function PencilLoader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 220;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cx = 110;
    const cy = 110;
    const radius = 68;

    const PI = Math.PI;
    const TAU = PI * 2;
    const A0 = -PI / 2;

    const INK = '#000000';
    const PAPER = '#ffffff';
    const YELLOW = '#ffd43b';
    const PINK = '#ff5c8a';
    const GRAY = '#b8b8b8';
    const WOOD = '#ffd8a8';

    const LINE_WIDTH = 6;
    const LINE_SHADOW = 5;
    const PENCIL_SHADOW = 4;

    const REV_MS = 1400;
    const SCRUB_HZ = 5;
    const SCRUB_ANGLE = 0.26;
    const ERASE_SLOW = 0.45;

    const CONTACT_X = 8;
    const ERASER_END_X = 76;
    const MID_Y = 12;

    const DELTA = (ERASER_END_X - CONTACT_X) / radius;
    const ERASE_FROM = TAU - DELTA;
    const ERASE_TO = TAU * 2 - DELTA + 0.15;

    function wobble(a: number) {
      return (
        Math.sin(a * 3) * 1.6 +
        Math.sin(a * 5 + 1.3) * 0.9 +
        Math.sin(a * 8 + 0.4) * 0.35
      );
    }

    function getPosition(a: number) {
      const r = radius + wobble(a);
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    }

    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    const smoothstep = (a: number, b: number, v: number) => {
      const t = clamp((v - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };

    const BASE_SPEED = TAU / REV_MS;

    function speedAt(h: number) {
      const front = h + DELTA - TAU;
      const touching =
        smoothstep(-0.35, 0.15, front) *
        (1 - smoothstep(TAU - 0.15, TAU + 0.35, front));
      const slow = 1 - (1 - ERASE_SLOW) * touching;
      return BASE_SPEED * (1 + 0.18 * Math.cos(h)) * slow;
    }

    const STEP = 0.004;
    const STEPS = Math.ceil((TAU * 2) / STEP);
    const timeAt = new Float64Array(STEPS + 1);

    for (let i = 0; i < STEPS; i++) {
      timeAt[i + 1] = timeAt[i] + STEP / speedAt((i + 0.5) * STEP);
    }

    const TOTAL = timeAt[STEPS];

    function cycleAngle(ms: number) {
      let lo = 0;
      let hi = STEPS;

      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (timeAt[mid] <= ms) lo = mid;
        else hi = mid;
      }

      const span = timeAt[lo + 1] - timeAt[lo];
      const f = span > 0 ? (ms - timeAt[lo]) / span : 0;
      return (lo + f) * STEP;
    }

    function strokeArc(fromAngle: number, toAngle: number, offset: number, color: string) {
      const span = toAngle - fromAngle;
      if (span < 0.004) return;

      const steps = Math.max(2, Math.ceil(span * 50));

      ctx!.lineWidth = LINE_WIDTH;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      ctx!.strokeStyle = color;

      ctx!.beginPath();

      for (let i = 0; i <= steps; i++) {
        const p = getPosition(fromAngle + (span * i) / steps);
        if (i === 0) ctx!.moveTo(p.x + offset, p.y + offset);
        else ctx!.lineTo(p.x + offset, p.y + offset);
      }

      ctx!.stroke();
    }

    const rect = (x0: number, y0: number, x1: number, y1: number) => [
      [x0, y0], [x1, y0], [x1, y1], [x0, y1]
    ];

    const PARTS: any[] = [
      { pts: [
          [50, 4.5], [59.5, 4.5], [59.5, 3.5], [74.5, 3.5],
          [74.5, 20.5], [59.5, 20.5], [59.5, 19.5], [50, 19.5]
        ], fill: GRAY, stroke: true, eraser: true },
      { pts: [[0, 12], [16, 1], [16, 23]], fill: INK, stroke: false },
      { pts: [[7, 12], [16, 4], [16, 20]], fill: WOOD, stroke: false },
      { pts: rect(14.5, 4.5, 58.5, 19.5), fill: YELLOW, stroke: true },
      { pts: rect(46, 4.5, 49, 19.5), fill: INK, stroke: false },
      { pts: rect(53.5, 3.5, 59.5, 20.5), fill: PAPER, stroke: true }
    ];

    let scrubAngle = 0;
    const HINGE_X = 56;

    function bendPoint(x: number, y: number, head: number, bendRadius: number) {
      const a = head + (x - CONTACT_X) / bendRadius;
      const r = bendRadius - (y - MID_Y);
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }

    function tracePart(part: any, head: number, bendRadius: number) {
      const pts = part.pts;
      const ang = part.eraser ? scrubAngle : 0;
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);

      ctx!.beginPath();

      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));

        for (let j = 0; j < n; j++) {
          const t = j / n;
          let lx = x0 + (x1 - x0) * t;
          let ly = y0 + (y1 - y0) * t;

          if (ang !== 0) {
            const ux = lx - HINGE_X;
            const uy = ly - MID_Y;
            lx = HINGE_X + ux * cosA - uy * sinA;
            ly = MID_Y + ux * sinA + uy * cosA;
          }

          const [px, py] = bendPoint(lx, ly, head, bendRadius);

          if (i === 0 && j === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
      }
      ctx!.closePath();
    }

    function drawPencil(head: number) {
      const bendRadius = radius + wobble(head);

      ctx!.lineJoin = 'miter';
      ctx!.lineWidth = 3;

      ctx!.save();
      ctx!.translate(PENCIL_SHADOW, PENCIL_SHADOW);
      ctx!.fillStyle = INK;
      ctx!.strokeStyle = INK;

      for (const part of PARTS) {
        tracePart(part, head, bendRadius);
        ctx!.fill();
        if (part.stroke) ctx!.stroke();
      }
      ctx!.restore();

      ctx!.strokeStyle = INK;

      for (const part of PARTS) {
        tracePart(part, head, bendRadius);
        ctx!.fillStyle = part.fill;
        ctx!.fill();
        if (part.stroke) ctx!.stroke();
      }
    }

    let animationFrameId: number;
    let startTime: number | null = null;
    let erasedFrom = 0;

    function animate(timestamp: number) {
      if (startTime === null) startTime = timestamp;
      const t = (timestamp - startTime) % TOTAL;

      const h = cycleAngle(t);
      const head = A0 + h;
      const bendRadius = radius + wobble(head);

      let from = 0;
      let to = 0;
      scrubAngle = 0;

      if (h <= TAU) {
        from = 0;
        to = h;
        erasedFrom = 0;
      } else if (h >= ERASE_FROM && h <= ERASE_TO) {
        const frontBase = h + (ERASER_END_X - CONTACT_X) / bendRadius - TAU;
        const fade = smoothstep(0, 0.1, frontBase) * (1 - smoothstep(TAU - 0.1, TAU + 0.1, frontBase));

        scrubAngle = Math.sin((t / 1000) * TAU * SCRUB_HZ) * SCRUB_ANGLE * fade;
        const front = frontBase;
        erasedFrom = Math.max(erasedFrom, clamp(front, 0, TAU));

        from = erasedFrom;
        to = TAU;
      } else if (h > ERASE_TO) {
        from = TAU;
        to = TAU;
        erasedFrom = TAU;
      } else {
        from = 0;
        to = TAU;
        erasedFrom = 0;
      }

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, size, size);

      strokeArc(A0 + from, A0 + to, LINE_SHADOW, PINK);
      strokeArc(A0 + from, A0 + to, 0, INK);

      if (!reduceMotion) drawPencil(head);

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px' }} role="status" aria-label="Memuat">
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', marginTop: '10px', letterSpacing: '1px' }}>
        Memuat Data...
      </span>
    </div>
  );
}