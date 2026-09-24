import { useRef, useEffect, useCallback, useState, memo } from "react";
import {
  buildings,
  pathEdges,
  pathNodes,
  trees,
  CAMPUS_WIDTH,
  CAMPUS_HEIGHT,
} from "@/data/campus";
import { useNavigationStore, useUIStore } from "@/store/useStore";

// Simple 3D renderer using Canvas (no Three.js dependency for performance/bundle size)
// Isometric-style 3D projection

interface Camera3D {
  rotX: number; // pitch
  rotZ: number; // yaw
  distance: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

function project(
  x: number,
  y: number,
  z: number,
  cam: Camera3D,
  canvas: { w: number; h: number },
) {
  // Center coordinates
  const cx = x - cam.centerX;
  const cy = y - cam.centerY;
  const cz = z - cam.centerZ;

  // Rotate around Z axis (yaw)
  const cosZ = Math.cos(cam.rotZ);
  const sinZ = Math.sin(cam.rotZ);
  const rx = cx * cosZ - cy * sinZ;
  const ry = cx * sinZ + cy * cosZ;
  const rz = cz;

  // Rotate around X axis (pitch)
  const cosX = Math.cos(cam.rotX);
  const sinX = Math.sin(cam.rotX);
  const fx = rx;
  const fy = ry * cosX - rz * sinX;
  const fz = ry * sinX + rz * cosX;

  // Perspective projection
  const perspective = cam.distance / (cam.distance + fz);
  const sx = canvas.w / 2 + fx * perspective;
  const sy = canvas.h / 2 + fy * perspective;

  return { x: sx, y: sy, depth: fz, scale: perspective };
}

export default memo(function Campus3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera3D>({
    rotX: -0.6,
    rotZ: 0.3,
    distance: 800,
    centerX: CAMPUS_WIDTH / 2,
    centerY: CAMPUS_HEIGHT / 2,
    centerZ: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotZ: 0 });
  const animRef = useRef<number>(0);
  const routePath = useNavigationStore((s) => s.routePath);
  const timeOfDay = useUIStore((s) => s.timeOfDay);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cam = cameraRef.current;
    const canvasSize = { w, h };

    // Clear
    const bgColor =
      timeOfDay === "night"
        ? "#050810"
        : timeOfDay === "dusk"
          ? "#0f0a15"
          : "#0a1210";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Ground plane
    const groundCorners = [
      project(0, 0, 0, cam, canvasSize),
      project(CAMPUS_WIDTH, 0, 0, cam, canvasSize),
      project(CAMPUS_WIDTH, CAMPUS_HEIGHT, 0, cam, canvasSize),
      project(0, CAMPUS_HEIGHT, 0, cam, canvasSize),
    ];

    ctx.beginPath();
    ctx.moveTo(groundCorners[0]!.x, groundCorners[0]!.y);
    for (let i = 1; i < groundCorners.length; i++) {
      ctx.lineTo(groundCorners[i]!.x, groundCorners[i]!.y);
    }
    ctx.closePath();
    ctx.fillStyle = timeOfDay === "night" ? "#0a1a0d" : "#1a3a1a";
    ctx.fill();
    ctx.strokeStyle = "#ffffff10";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = "#ffffff06";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CAMPUS_WIDTH; i += 100) {
      const p1 = project(i, 0, 0, cam, canvasSize);
      const p2 = project(i, CAMPUS_HEIGHT, 0, cam, canvasSize);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let i = 0; i <= CAMPUS_HEIGHT; i += 100) {
      const p1 = project(0, i, 0, cam, canvasSize);
      const p2 = project(CAMPUS_WIDTH, i, 0, cam, canvasSize);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Roads
    ctx.strokeStyle = timeOfDay === "night" ? "#1e293b" : "#374151";
    ctx.lineWidth = 2;
    pathEdges.forEach((edge) => {
      const from = pathNodes.find((n) => n.id === edge.from);
      const to = pathNodes.find((n) => n.id === edge.to);
      if (!from || !to) return;
      const p1 = project(from.x, from.y, 0, cam, canvasSize);
      const p2 = project(to.x, to.y, 0, cam, canvasSize);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Trees
    trees.forEach((tree) => {
      const base = project(tree.x, tree.y, 0, cam, canvasSize);
      const top = project(tree.x, tree.y, tree.size * 2, cam, canvasSize);

      // Trunk
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.strokeStyle = "#5c4033";
      ctx.lineWidth = 1.5 * base.scale;
      ctx.stroke();

      // Canopy
      ctx.beginPath();
      ctx.arc(top.x, top.y, tree.size * 0.4 * base.scale, 0, Math.PI * 2);
      ctx.fillStyle = "#228B2260";
      ctx.fill();
    });

    // Sort buildings by depth for proper rendering
    const sortedBuildings = [...buildings]
      .map((b) => {
        const center = project(
          b.x + b.width / 2,
          b.y + b.height / 2,
          0,
          cam,
          canvasSize,
        );
        return { ...b, projDepth: center.depth };
      })
      .sort((a, b) => b.projDepth - a.projDepth);

    // Buildings as 3D boxes
    sortedBuildings.forEach((building) => {
      const height = Math.max(8, building.floors * 12 + building.elevation);

      // Bottom face corners
      const bl = project(
        building.x,
        building.y + building.height,
        0,
        cam,
        canvasSize,
      );
      const br = project(
        building.x + building.width,
        building.y + building.height,
        0,
        cam,
        canvasSize,
      );
      const tr = project(
        building.x + building.width,
        building.y,
        0,
        cam,
        canvasSize,
      );
      // tl not used but kept for reference
      project(building.x, building.y, 0, cam, canvasSize);

      // Top face corners
      const tbl = project(
        building.x,
        building.y + building.height,
        height,
        cam,
        canvasSize,
      );
      const tbr = project(
        building.x + building.width,
        building.y + building.height,
        height,
        cam,
        canvasSize,
      );
      const ttr = project(
        building.x + building.width,
        building.y,
        height,
        cam,
        canvasSize,
      );
      const ttl = project(building.x, building.y, height, cam, canvasSize);

      // Right face
      ctx.beginPath();
      ctx.moveTo(br.x, br.y);
      ctx.lineTo(tr.x, tr.y);
      ctx.lineTo(ttr.x, ttr.y);
      ctx.lineTo(tbr.x, tbr.y);
      ctx.closePath();
      ctx.fillStyle = building.color + "90";
      ctx.fill();
      ctx.strokeStyle = building.color + "cc";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Left face
      ctx.beginPath();
      ctx.moveTo(bl.x, bl.y);
      ctx.lineTo(br.x, br.y);
      ctx.lineTo(tbr.x, tbr.y);
      ctx.lineTo(tbl.x, tbl.y);
      ctx.closePath();
      ctx.fillStyle = building.color + "70";
      ctx.fill();
      ctx.strokeStyle = building.color + "cc";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Top face
      ctx.beginPath();
      ctx.moveTo(ttl.x, ttl.y);
      ctx.lineTo(ttr.x, ttr.y);
      ctx.lineTo(tbr.x, tbr.y);
      ctx.lineTo(tbl.x, tbl.y);
      ctx.closePath();
      ctx.fillStyle = building.color + "bb";
      ctx.fill();
      ctx.strokeStyle = building.color + "ee";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Night windows
      if (
        timeOfDay === "night" &&
        building.floors > 0 &&
        building.category !== "sports"
      ) {
        for (let f = 0; f < building.floors; f++) {
          for (let w = 0; w < 3; w++) {
            const winZ = f * 12 + 4;
            const winX = building.x + 10 + (w * (building.width - 20)) / 3;
            const winP = project(
              winX,
              building.y + building.height,
              winZ,
              cam,
              canvasSize,
            );
            ctx.fillStyle = "#fbbf24";
            ctx.globalAlpha = 0.3 + Math.random() * 0.4;
            ctx.fillRect(winP.x - 2, winP.y - 1.5, 4, 3);
            ctx.globalAlpha = 1;
          }
        }
      }

      // Label
      const labelP = project(
        building.x + building.width / 2,
        building.y + building.height / 2,
        height + 8,
        cam,
        canvasSize,
      );
      if (labelP.scale > 0.3) {
        ctx.font = `${Math.max(8, 10 * labelP.scale)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffffcc";
        ctx.fillText(building.shortName, labelP.x, labelP.y);
      }
    });

    // Route
    if (routePath && routePath.length > 1) {
      ctx.beginPath();
      const first = project(
        routePath[0]!.x,
        routePath[0]!.y,
        2,
        cam,
        canvasSize,
      );
      ctx.moveTo(first.x, first.y);
      routePath.forEach((node, i) => {
        if (i === 0) return;
        const p = project(node.x, node.y, 2, cam, canvasSize);
        ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Route endpoints
      const startP = project(
        routePath[0]!.x,
        routePath[0]!.y,
        5,
        cam,
        canvasSize,
      );
      const endP = project(
        routePath[routePath.length - 1]!.x,
        routePath[routePath.length - 1]!.y,
        5,
        cam,
        canvasSize,
      );

      ctx.beginPath();
      ctx.arc(startP.x, startP.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endP.x, endP.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [routePath, timeOfDay]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Auto-rotate slightly
    let autoRotate = true;
    const loop = () => {
      if (autoRotate && !isDragging) {
        cameraRef.current.rotZ += 0.001;
      }
      render();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [render, isDragging]);

  // Mouse interaction
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: cameraRef.current.rotX,
      rotZ: cameraRef.current.rotZ,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      cameraRef.current.rotZ = dragStart.current.rotZ + dx * 0.005;
      cameraRef.current.rotX = Math.max(
        -1.2,
        Math.min(-0.1, dragStart.current.rotX + dy * 0.005),
      );
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.05 : 0.95;
    cameraRef.current.distance = Math.max(
      300,
      Math.min(2000, cameraRef.current.distance * delta),
    );
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* 3D Mode indicator */}
      <div className="absolute top-4 left-4 bg-[#0a0e1a]/80 backdrop-blur-md rounded-lg border border-white/[0.06] px-3 py-1.5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
          3D View
        </span>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#0a0e1a]/60 backdrop-blur-md rounded-lg border border-white/[0.06] px-4 py-2 flex items-center gap-3">
        <span className="text-[10px] text-white/25">🖱️ Drag to rotate</span>
        <span className="text-[10px] text-white/25">🔍 Scroll to zoom</span>
      </div>
    </div>
  );
});
