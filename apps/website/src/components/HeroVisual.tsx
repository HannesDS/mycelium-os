"use client";

import { useEffect, useRef } from "react";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
  pulseOffset: number;
  radius: number;
}

interface Packet {
  from: number;
  to: number;
  progress: number;
  speed: number;
  color: string;
}

const NODES: Node[] = [
  { id: "ceo", x: 0.5, y: 0.18, label: "root-shroom", color: "#4ade80", pulseOffset: 0, radius: 7 },
  { id: "sales", x: 0.2, y: 0.42, label: "sales-shroom", color: "#22d3ee", pulseOffset: 0.6, radius: 6 },
  { id: "delivery", x: 0.5, y: 0.52, label: "delivery-shroom", color: "#a78bfa", pulseOffset: 1.2, radius: 6 },
  { id: "billing", x: 0.8, y: 0.42, label: "billing-shroom", color: "#fb923c", pulseOffset: 1.8, radius: 6 },
  { id: "compliance", x: 0.35, y: 0.76, label: "compliance-shroom", color: "#f472b6", pulseOffset: 2.4, radius: 5 },
  { id: "human", x: 0.65, y: 0.76, label: "human inbox", color: "#fbbf24", pulseOffset: 3.0, radius: 5 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3],
  [1, 2], [2, 3],
  [2, 4], [2, 5],
  [0, 5],
];

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const packetsRef = useRef<Packet[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spawnPacket = () => {
      const edge = EDGES[Math.floor(Math.random() * EDGES.length)];
      const reversed = Math.random() > 0.5;
      packetsRef.current.push({
        from: reversed ? edge[1] : edge[0],
        to: reversed ? edge[0] : edge[1],
        progress: 0,
        speed: 0.004 + Math.random() * 0.004,
        color: NODES[reversed ? edge[1] : edge[0]].color,
      });
    };

    // Spawn initial packets
    for (let i = 0; i < 4; i++) {
      spawnPacket();
      packetsRef.current[i].progress = Math.random();
    }

    let lastSpawn = 0;

    const draw = (timestamp: number) => {
      // Guard first frame: timeRef starts at 0, so first dt would be huge
      if (timeRef.current === 0) {
        timeRef.current = timestamp;
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      const dt = timestamp - timeRef.current;
      timeRef.current = timestamp;

      // Sync canvas backing size to CSS size and devicePixelRatio
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.max(1, Math.floor(rect.width * dpr));
      const targetH = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const W = rect.width;
      const H = rect.height;

      ctx.clearRect(0, 0, W, H);

      // Compute node positions
      const pos = NODES.map((n) => ({
        ...n,
        x: n.x * W,
        y: n.y * H,
      }));

      // Draw edges
      EDGES.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(pos[a].x, pos[a].y);
        ctx.lineTo(pos[b].x, pos[b].y);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Update and draw packets
      packetsRef.current = packetsRef.current.filter((p) => {
        p.progress += p.speed * (dt / 16);
        if (p.progress >= 1) return false;

        const from = pos[p.from];
        const to = pos[p.to];
        const x = from.x + (to.x - from.x) * p.progress;
        const y = from.y + (to.y - from.y) * p.progress;

        // Packet trail
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
        grad.addColorStop(0, p.color + "cc");
        grad.addColorStop(1, p.color + "00");
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        return true;
      });

      // Spawn new packets
      if (timestamp - lastSpawn > 800 + Math.random() * 600) {
        spawnPacket();
        lastSpawn = timestamp;
      }

      // Draw nodes
      pos.forEach((n, i) => {
        const t = (timestamp / 1000 + n.pulseOffset) % (Math.PI * 2);
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.5);

        // Outer glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 4);
        glow.addColorStop(0, n.color + Math.round(pulse * 40 + 10).toString(16).padStart(2, "0"));
        glow.addColorStop(1, n.color + "00");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Node body
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#111111";
        ctx.fill();
        ctx.strokeStyle = n.color + Math.round(pulse * 155 + 100).toString(16).padStart(2, "0");
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = n.color + Math.round(pulse * 155 + 100).toString(16).padStart(2, "0");
        ctx.fill();

        // Label
        ctx.font = `10px "JetBrains Mono", monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.textAlign = "center";
        const labelY = n.y + n.radius + 14;
        ctx.fillText(n.label, n.x, labelY);
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(74,222,128,0.06) 0%, transparent 70%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxWidth: 520, maxHeight: 340 }}
      />
    </div>
  );
}
