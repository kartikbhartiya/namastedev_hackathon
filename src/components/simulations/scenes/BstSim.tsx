"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, RotateCcw, Plus, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x?: number;
  y?: number;
}

function insertNode(root: TreeNode | null, val: number): TreeNode {
  if (!root) return { val, left: null, right: null };
  if (val < root.val) root.left = insertNode(root.left, val);
  else if (val > root.val) root.right = insertNode(root.right, val);
  return root;
}

function calculatePositions(node: TreeNode | null, x = 350, y = 50, level = 0): { node: TreeNode; x: number; y: number }[] {
  if (!node) return [];
  node.x = x;
  node.y = y;

  const dx = Math.max(20, 140 / (level + 1));
  const dy = 55;

  const current = [{ node, x, y }];
  const left = calculatePositions(node.left, x - dx, y + dy, level + 1);
  const right = calculatePositions(node.right, x + dx, y + dy, level + 1);

  return [...current, ...left, ...right];
}

export function BstSim() {
  const [values, setValues] = useState<number[]>([50, 30, 70, 20, 40, 60, 80]);
  const [inputVal, setInputVal] = useState("");
  const [searchTarget, setSearchTarget] = useState<number | null>(null);
  const [highlightedVal, setHighlightedVal] = useState<number | null>(null);
  const [traversalResult, setTraversalResult] = useState<number[]>([]);
  const [traversalType, setTraversalType] = useState<string>("");

  const treeRoot = useMemo(() => {
    let root: TreeNode | null = null;
    values.forEach(v => {
      root = insertNode(root, v);
    });
    return root;
  }, [values]);

  const positionedNodes = useMemo(() => calculatePositions(treeRoot), [treeRoot]);

  const handleAdd = () => {
    const num = parseInt(inputVal, 10);
    if (!isNaN(num) && !values.includes(num)) {
      setValues([...values, num]);
      setInputVal("");
    }
  };

  const handleSearch = () => {
    const num = parseInt(inputVal, 10);
    if (!isNaN(num)) {
      setSearchTarget(num);
      setHighlightedVal(num);
    }
  };

  const runTraversal = (type: "inorder" | "preorder" | "postorder") => {
    const res: number[] = [];
    const traverse = (n: TreeNode | null) => {
      if (!n) return;
      if (type === "preorder") res.push(n.val);
      traverse(n.left);
      if (type === "inorder") res.push(n.val);
      traverse(n.right);
      if (type === "postorder") res.push(n.val);
    };
    traverse(treeRoot);
    setTraversalType(type.toUpperCase());
    setTraversalResult(res);
  };

  const handleReset = () => {
    setValues([50, 30, 70, 20, 40, 60, 80]);
    setInputVal("");
    setSearchTarget(null);
    setHighlightedVal(null);
    setTraversalResult([]);
  };

  return (
    <div className="p-5 bg-neutral-900/90 border border-white/10 rounded-2xl space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Binary Search Tree (BST) Visualizer
          </h3>
          <p className="text-xs text-neutral-400">Insert nodes, search values, and compute Inorder / Preorder / Postorder traversals</p>
        </div>
        <Button onClick={handleReset} variant="outline" size="sm" className="h-8 border-white/10 text-xs text-neutral-300">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-white/5">
        <Input
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Node Value (e.g. 45)"
          className="w-36 h-9 text-xs bg-neutral-900 border-white/10 text-white"
        />
        <Button onClick={handleAdd} size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 font-bold">
          <Plus className="w-3.5 h-3.5" /> Insert
        </Button>
        <Button onClick={handleSearch} size="sm" variant="secondary" className="h-9 text-xs gap-1 font-bold">
          <Search className="w-3.5 h-3.5" /> Search
        </Button>

        <div className="h-6 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-1.5">
          <Button onClick={() => runTraversal("inorder")} size="sm" variant="ghost" className="h-8 text-xs text-blue-400 hover:bg-blue-500/10 font-bold">
            Inorder
          </Button>
          <Button onClick={() => runTraversal("preorder")} size="sm" variant="ghost" className="h-8 text-xs text-purple-400 hover:bg-purple-500/10 font-bold">
            Preorder
          </Button>
          <Button onClick={() => runTraversal("postorder")} size="sm" variant="ghost" className="h-8 text-xs text-amber-400 hover:bg-amber-500/10 font-bold">
            Postorder
          </Button>
        </div>
      </div>

      {/* SVG Tree Canvas */}
      <div className="relative w-full h-[280px] bg-neutral-950 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 700 280" className="w-full h-full">
          {/* Render Lines */}
          {positionedNodes.map(({ node, x, y }) => (
            <g key={`lines-${node.val}`}>
              {node.left && node.left.x && node.left.y && (
                <line x1={x} y1={y} x2={node.left.x} y2={node.left.y} stroke="#525252" strokeWidth="2" />
              )}
              {node.right && node.right.x && node.right.y && (
                <line x1={x} y1={y} x2={node.right.x} y2={node.right.y} stroke="#525252" strokeWidth="2" />
              )}
            </g>
          ))}

          {/* Render Nodes */}
          {positionedNodes.map(({ node, x, y }) => {
            const isTarget = highlightedVal === node.val;
            return (
              <g key={`node-${node.val}`} className="transition-all duration-300">
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  className={cn(
                    "transition-all duration-300",
                    isTarget ? "fill-emerald-500 stroke-emerald-300 stroke-2 animate-bounce" : "fill-neutral-800 stroke-neutral-600 stroke-2"
                  )}
                />
                <text
                  x={x}
                  y={y + 4}
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {node.val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Traversal Output Banner */}
      {traversalResult.length > 0 && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300 flex items-center justify-between">
          <span><strong className="text-white">{traversalType} Traversal:</strong> [{traversalResult.join(" → ")}]</span>
        </div>
      )}
    </div>
  );
}
