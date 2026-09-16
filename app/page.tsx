"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Cloud,
  Layers,
  CheckCircle2,
  XCircle,
  RefreshCw,
  PlusCircle,
  Trash2,
  ExternalLink,
  Zap,
  Server,
  Terminal,
  ShieldCheck,
  GitBranch,
  Globe,
  Copy,
  Check,
} from "lucide-react";

interface DbCheckResult {
  success: boolean;
  message?: string;
  database?: string;
  latencyMs?: number;
  collections?: string[];
  error?: string;
  tip?: string;
}

interface Item {
  _id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
}

export default function Home() {
  const [dbStatus, setDbStatus] = useState<DbCheckResult | null>(null);
  const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [originUrl, setOriginUrl] = useState<string>("https://next-cloud-mongodb.pages.dev");
  const [copied, setCopied] = useState<boolean>(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Development");

  // Check MongoDB connection
  const checkConnection = async () => {
    setLoadingCheck(true);
    try {
      const res = await fetch("/api/db-check");
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: false,
          error: "Connection timed out. Please ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.",
        };
      }
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        success: false,
        error: err.message || "Failed to reach API route",
      });
    } finally {
      setLoadingCheck(false);
    }
  };

  // Fetch items from MongoDB
  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/items");
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      if (json && json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  // Add a new item to MongoDB
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle("");
        setDescription("");
        await fetchItems();
        await checkConnection(); // Update collection info
      } else {
        alert("Error adding item: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete an item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from MongoDB?")) return;
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((item) => item._id !== id));
      } else {
        alert("Failed to delete: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const copyApiUrl = (endpoint: string = "/api/db-check") => {
    const fullUrl = `${originUrl}${endpoint}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOriginUrl(window.location.origin);
    }
    checkConnection();
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-64 bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation / Header */}
      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Next.js <span className="text-slate-500">×</span> MongoDB
              </span>
              <span className="text-[11px] text-slate-400 block -mt-1">
                Cloudflare Pages Edge Architecture
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/me16376/next-cloud-mongodb"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span>me16376/next-cloud-mongodb</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 mb-4">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Cloudflare Edge Functions + MongoDB Atlas TCP</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Next.js on <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Cloudflare Pages</span> with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">MongoDB Atlas</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Deployed via GitHub using Cloudflare Functions edge runtime with <code className="text-slate-200 bg-slate-800/70 px-1.5 py-0.5 rounded text-xs">nodejs_compat</code>. Fast, serverless, and production-ready.
          </p>
        </div>

        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: MongoDB Live Status */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 glow-mongo flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">MongoDB Atlas</h3>
                </div>
                {loadingCheck ? (
                  <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                ) : dbStatus?.success ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
                    <XCircle className="w-3.5 h-3.5" />
                    Disconnected
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Database:</span>
                  <span className="text-slate-200 font-mono">{dbStatus?.database || "next_cloud_db"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Cluster Host:</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate max-w-[150px]">mosabber.8onjvem</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Ping Latency:</span>
                  <span className="text-emerald-300 font-mono font-semibold">
                    {dbStatus?.latencyMs !== undefined ? `${dbStatus.latencyMs} ms` : "--"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Auth:</span>
                  <span className="text-emerald-400 font-mono text-xs">Configured (Env)</span>
                </div>
              </div>
            </div>

            <button
              onClick={checkConnection}
              disabled={loadingCheck}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCheck ? "animate-spin" : ""}`} />
              Test DB Ping Now
            </button>
          </div>

          {/* Card 2: Cloudflare Pages & Edge */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 glow-cloudflare flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">Cloudflare Pages</h3>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                  <Server className="w-3.5 h-3.5" />
                  Functions
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Runtime:</span>
                  <span className="text-slate-200 font-mono">Edge / V8 Isolate</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Flag:</span>
                  <span className="text-amber-300 font-mono font-medium">nodejs_compat</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Build Command:</span>
                  <span className="text-slate-200 font-mono">npx next build</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Output Dir:</span>
                  <span className="text-slate-200 font-mono">out</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-[11px] text-slate-400">
              <span className="text-amber-300 font-semibold">Tip:</span> Set <code className="text-slate-200">nodejs_compat</code> in Cloudflare dashboard project settings.
            </div>
          </div>

          {/* Card 3: Active API & Endpoints */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 glow-mongo flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">Active API Endpoints</h3>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Live Routes
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-400">Host Domain:</span>
                  <span className="text-cyan-300 font-mono text-[11px] truncate max-w-[160px]" title={originUrl}>
                    {originUrl ? originUrl.replace(/^https?:\/\//, "") : "loading..."}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-400">DB Ping Route:</span>
                  <a
                    href={`${originUrl}/api/db-check`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px] hover:underline group"
                  >
                    /api/db-check
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-300" />
                  </a>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-400">Items CRUD:</span>
                  <a
                    href={`${originUrl}/api/items`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-200 font-mono text-[11px] hover:underline group"
                  >
                    /api/items
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-300" />
                  </a>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">API Status:</span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    {dbStatus?.success ? "200 OK (Online)" : "Connecting..."}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-slate-900/70 border border-white/5 text-[11px] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active API URL</p>
                <p className="font-mono text-cyan-300 truncate text-[11px]">{originUrl}/api/db-check</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => copyApiUrl("/api/db-check")}
                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all flex items-center gap-1 text-xs"
                  title="Copy API URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`${originUrl}/api/db-check`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1 text-xs"
                  title="Open API in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Error notification if connection fails */}
        {dbStatus && !dbStatus.success && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-rose-300">Database Connection Notice</p>
              <p className="mt-1">{dbStatus.error}</p>
              {dbStatus.tip && (
                <p className="mt-1.5 text-rose-400 font-medium">💡 {dbStatus.tip}</p>
              )}
            </div>
          </div>
        )}

        {/* CRUD Section: Create and List Items */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Add Document */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-base text-white">Add Document to MongoDB</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Insert live records into the <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">items</code> collection in your MongoDB Atlas database.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Deployment Test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                >
                  <option value="Development">Development</option>
                  <option value="Cloudflare Edge">Cloudflare Edge</option>
                  <option value="MongoDB Atlas">MongoDB Atlas</option>
                  <option value="Production Note">Production Note</option>
                  <option value="Testing">Testing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional metadata or note details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to MongoDB...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Save Document</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right List: Live Documents */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-white/10 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-base text-white">
                  Live MongoDB Documents ({items.length})
                </h2>
              </div>
              <button
                onClick={fetchItems}
                disabled={loadingItems}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Refresh Documents"
              >
                <RefreshCw className={`w-4 h-4 ${loadingItems ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1">
              {loadingItems && items.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading documents from MongoDB...
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  No documents in <code className="text-slate-400">items</code> collection yet.
                  <p className="text-xs text-slate-500 mt-1">Use the form on the left to add your first record!</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/15 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono pt-1">
                        ID: {item._id} • {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100"
                      title="Delete from MongoDB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>


      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>Built with Next.js App Router, MongoDB Atlas & Cloudflare Pages Functions</p>
      </footer>
    </div>
  );
}
