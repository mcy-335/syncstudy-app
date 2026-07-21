"use client";

import { useEffect, useRef } from "react";
import type { MindmapResult } from "@/lib/types";

type ParsedNode = {
  id: number;
  label: string;
  depth: number;
  parentId: number | null;
  x: number;
  y: number;
};

export function MindmapCanvas({ result, onNotify }: { result: MindmapResult; onNotify: (message: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawMindmap(canvasRef.current, result.tree);
  }, [result.tree]);

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        onNotify("\u56fe\u7247\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${result.title.replace(/[\\/:*?"<>|]/g, "-")}.png`;
      link.click();
      URL.revokeObjectURL(url);
      onNotify("\u601d\u7ef4\u5bfc\u56fe PNG \u5df2\u4e0b\u8f7d");
    }, "image/png");
  }

  return (
    <section className="mindmap-image-card" aria-label="Mind map image preview">
      <div className="mindmap-image-toolbar">
        <div><span className="verified-dot" />{"\u56fe\u7247\u601d\u7ef4\u5bfc\u56fe"}</div>
        <button onClick={downloadPng}><DownloadIcon />{"\u4e0b\u8f7d PNG"}</button>
      </div>
      <div className="mindmap-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}

function parseTree(tree: string): ParsedNode[] {
  const rows = tree.split(/\r?\n/).map((row) => row.trimEnd()).filter(Boolean);
  const stack: ParsedNode[] = [];
  return rows.map((row, id) => {
    const branchIndex = Math.max(row.lastIndexOf("\u251c"), row.lastIndexOf("\u2514"));
    const depth = id === 0 ? 0 : branchIndex >= 0 ? Math.floor(branchIndex / 3) + 1 : Math.floor((row.length - row.trimStart().length) / 3);
    const label = row.replace(/[\u2502\u251c\u2514\u2500]/g, "").trim();
    const node: ParsedNode = { id, label, depth, parentId: depth > 0 ? stack[depth - 1]?.id ?? 0 : null, x: 0, y: 0 };
    stack[depth] = node;
    stack.length = depth + 1;
    return node;
  });
}

function drawMindmap(canvas: HTMLCanvasElement, tree: string) {
  const nodes = parseTree(tree);
  if (!nodes.length) return;

  const children = new Map<number, ParsedNode[]>();
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const group = children.get(node.parentId) ?? [];
    group.push(node);
    children.set(node.parentId, group);
  }

  let leafIndex = 0;
  const placeY = (node: ParsedNode): number => {
    const childNodes = children.get(node.id) ?? [];
    if (!childNodes.length) {
      node.y = 70 + leafIndex * 104;
      leafIndex += 1;
      return node.y;
    }
    const childYs = childNodes.map(placeY);
    node.y = childYs.reduce((sum, value) => sum + value, 0) / childYs.length;
    return node.y;
  };
  placeY(nodes[0]);

  const maxDepth = Math.max(...nodes.map((node) => node.depth));
  const logicalWidth = Math.max(980, 100 + (maxDepth + 1) * 300);
  const logicalHeight = Math.max(520, 130 + Math.max(leafIndex, 1) * 104);
  const scale = 2;
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;
  canvas.style.aspectRatio = `${logicalWidth} / ${logicalHeight}`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f7fbff";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  ctx.fillStyle = "rgba(40, 120, 210, 0.12)";
  for (let x = 18; x < logicalWidth; x += 28) {
    for (let y = 18; y < logicalHeight; y += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const nodeWidth = 224;
  const nodeHeight = 66;
  for (const node of nodes) node.x = 48 + node.depth * 300;

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#8bb8e8";
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const parent = nodes.find((candidate) => candidate.id === node.parentId);
    if (!parent) continue;
    const startX = parent.x + nodeWidth;
    const startY = parent.y + nodeHeight / 2;
    const endX = node.x;
    const endY = node.y + nodeHeight / 2;
    const midpoint = (startX + endX) / 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(midpoint, startY, midpoint, endY, endX, endY);
    ctx.stroke();
  }

  for (const node of nodes) {
    const fill = node.depth === 0 ? "#123866" : node.depth === 1 ? "#2878d2" : "#ffffff";
    const text = node.depth <= 1 ? "#ffffff" : "#123866";
    ctx.save();
    ctx.shadowColor = "rgba(18, 56, 102, 0.14)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 7;
    roundedRect(ctx, node.x, node.y, nodeWidth, nodeHeight, 15);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
    if (node.depth >= 2) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#9bc4ec";
      roundedRect(ctx, node.x, node.y, nodeWidth, nodeHeight, 15);
      ctx.stroke();
    }
    ctx.fillStyle = text;
    ctx.font = `${node.depth === 0 ? 700 : 600} 18px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = wrapLabel(node.label, 12);
    const lineHeight = 24;
    const startY = node.y + nodeHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => ctx.fillText(line, node.x + nodeWidth / 2, startY + index * lineHeight));
  }
}

function wrapLabel(label: string, limit: number): string[] {
  if (label.length <= limit) return [label];
  return [label.slice(0, limit), label.slice(limit, limit * 2)];
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14" /></svg>;
}
