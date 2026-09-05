import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/Badge";
import {
  AlertTriangle, Send, Trash2, ChevronDown, ChevronUp, Zap,
  Package, Truck, ShoppingCart, TrendingDown, CheckCircle,
  AlertCircle, Info, Clock, DollarSign, User,
} from "lucide-react";

const EXAMPLE_NOTICES = [
  {
    label: "Supplier Production Halt",
    text: `Subject: URGENT - Production Halt Notification

Dear Valued Customer,

We regret to inform you that Apex Manufacturing has been forced to halt production at our main facility due to a critical equipment failure in our primary assembly line. This production halt affects all orders currently in our production schedule.

We expect the disruption to last approximately 14 days while we source and install replacement components. This will affect shipments SHP-2024-001, SHP-2024-003 and all associated orders.

We sincerely apologize for the inconvenience and will keep you updated.

Regards,
Operations Team
Apex Manufacturing`,
  },
  {
    label: "Carrier Delay Notice",
    text: `CARRIER DELAY NOTIFICATION
Tracking Reference: INTL-FREIGHT-9921

Due to severe port congestion at Rotterdam, Netherlands, we are experiencing significant delays across all inbound and outbound European routes. Current estimated delay: 8-12 days beyond scheduled arrival dates.

Shipment SHP-2024-002 and SHP-2024-004 are among affected consignments. Expected new arrival dates will be communicated within 48 hours.

Contact: freight-ops@globalcarrier.com`,
  },
  {
    label: "No Impact (Test)",
    text: `This is a routine system maintenance notification. No supply chain entities are affected. Scheduled downtime for internal IT systems from 02:00–04:00 UTC on Saturday. No action required from logistics or operations teams.`,
  },
];

const actionIcons: Record<string, React.ElementType> = {
  expedite: Zap,
  part_ship: Package,
  reallocate: ShoppingCart,
  inform_customer: User,
};

const actionColors: Record<string, string> = {
  expedite: "border-[#f59e0b]/30 bg-[#f59e0b]/5",
  part_ship: "border-[#3b82f6]/30 bg-[#3b82f6]/5",
  reallocate: "border-[#a855f7]/30 bg-[#a855f7]/5",
  inform_customer: "border-[#7a8fad]/30 bg-[#7a8fad]/5",
};

function ImpactCard({ result }: { result: any }) {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const impact = result.impact || {};
  const plan = result.action_plan || [];
  const matched = result.matched_entities || {};

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary banner */}
      <div className={`rounded-xl border px-4 py-4 ${
        result.no_impact ? "border-[#22c55e]/25 bg-[#22c55e]/5" :
        result.disruption_info?.severity === "critical" ? "border-[#ef4444]/25 bg-[#ef4444]/5" :
        result.disruption_info?.severity === "high" ? "border-[#f59e0b]/25 bg-[#f59e0b]/5" :
        "border-[#3b82f6]/25 bg-[#3b82f6]/5"
      }`}>
        <div className="flex items-start gap-3">
          {result.no_impact
            ? <CheckCircle className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
          }
          <div>
            <p className="text-sm font-medium text-[#e8eef8] leading-relaxed"
               dangerouslySetInnerHTML={{ __html: result.summary?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") || "" }} />
            {result.disruption_info && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge value={result.disruption_info.severity} variant="severity" />
                <span className="text-[10px] font-mono text-[#4a5e7a]">
                  Source: {result.source_type?.replace(/_/g, " ")}
                </span>
                {result.delay_days && (
                  <span className="text-[10px] font-mono text-[#4a5e7a]">
                    Est. delay: {result.delay_days} days
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matched entities */}
      {(matched.suppliers?.length > 0 || matched.shipments?.length > 0 || matched.products?.length > 0) && (
        <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-[#4a5e7a] mb-3">Matched Entities</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {matched.suppliers?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Truck className="w-3.5 h-3.5 text-[#00d4c8]" />
                  <span className="text-xs font-medium text-[#7a8fad]">Suppliers ({matched.suppliers.length})</span>
                </div>
                {matched.suppliers.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between bg-[#131929] rounded-lg px-2.5 py-1.5 mb-1">
                    <span className="text-xs text-[#e8eef8]">{s.name}</span>
                    <span className="text-[10px] font-mono text-[#4a5e7a]">{Math.round(s.score * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
            {matched.shipments?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span className="text-xs font-medium text-[#7a8fad]">Shipments ({matched.shipments.length})</span>
                </div>
                {matched.shipments.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between bg-[#131929] rounded-lg px-2.5 py-1.5 mb-1">
                    <span className="text-xs font-mono text-[#e8eef8]">{s.reference}</span>
                    {s.inferred && <span className="text-[9px] text-[#f59e0b]">inferred</span>}
                  </div>
                ))}
              </div>
            )}
            {matched.products?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Package className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span className="text-xs font-medium text-[#7a8fad]">Products ({matched.products.length})</span>
                </div>
                {matched.products.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-[#131929] rounded-lg px-2.5 py-1.5 mb-1">
                    <span className="text-xs text-[#e8eef8] truncate">{p.name}</span>
                    {p.inferred && <span className="text-[9px] text-[#f59e0b]">inferred</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock shortfalls */}
      {impact.stock_shortfalls?.length > 0 && (
        <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1f2d44]">
            <TrendingDown className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-xs font-semibold text-[#e8eef8]">Stock Shortfalls</span>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Product</th>
                <th className="text-right">Available</th>
                <th className="text-right">Reorder Level</th>
                <th className="text-right">Shortfall</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {impact.stock_shortfalls.map((s: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-[#e8eef8]">{s.product_id}</td>
                  <td className="text-right font-mono">{s.quantity_available}</td>
                  <td className="text-right font-mono">{s.reorder_level}</td>
                  <td className="text-right font-mono text-[#ef4444]">{s.shortfall}</td>
                  <td className="text-center">
                    {s.is_critical
                      ? <span className="text-[10px] text-[#ef4444] font-mono">CRITICAL</span>
                      : <span className="text-[10px] text-[#f59e0b] font-mono">LOW</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action plan */}
      {plan.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[#e8eef8] mb-3 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            <Zap className="w-4 h-4 text-[#00d4c8]" />
            Action Plan — {plan.length} Order{plan.length !== 1 ? "s" : ""} Ranked by Urgency
          </p>
          <div className="space-y-3">
            {plan.map((item: any, i: number) => {
              const fullOrder = impact.at_risk_orders?.find((o: any) => o.order_id === item.order_id);
              const isExpanded = expandedOrder === item.order_id;
              const ActionIcon = actionIcons[item.recommended_action] || AlertTriangle;
              return (
                <div key={item.order_id} className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-start gap-4 px-4 py-4 hover:bg-[#131929] transition-colors text-left"
                    onClick={() => setExpandedOrder(isExpanded ? null : item.order_id)}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00d4c8]/10 border border-[#00d4c8]/25 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#00d4c8]">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>
                          {item.reference}
                        </span>
                        <Badge value={item.priority} variant="priority" />
                        {item.days_until_delivery !== null && item.days_until_delivery !== undefined && (
                          <span className={`text-[10px] font-mono flex items-center gap-1 ${
                            item.days_until_delivery <= 0 ? "text-[#ef4444]" :
                            item.days_until_delivery <= 3 ? "text-[#f59e0b]" : "text-[#7a8fad]"
                          }`}>
                            <Clock className="w-3 h-3" />
                            {item.days_until_delivery <= 0 ? "OVERDUE" : `${item.days_until_delivery}d`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7a8fad] mt-0.5">{item.customer_name}</p>
                      <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg border text-xs ${actionColors[item.recommended_action] || ""}`}>
                        <ActionIcon className="w-3.5 h-3.5" />
                        <span className="font-medium text-[#e8eef8]">{item.action_label}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] font-mono text-[#4a5e7a]">Urgency</span>
                        <p className="text-sm font-bold text-[#e8eef8]">{item.urgency_score}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#4a5e7a]" /> : <ChevronDown className="w-4 h-4 text-[#4a5e7a]" />}
                    </div>
                  </button>

                  {isExpanded && fullOrder && (
                    <div className="border-t border-[#1f2d44] px-4 py-4 bg-[#080c14] space-y-4">
                      <p className="text-xs text-[#7a8fad] leading-relaxed">{item.action_description}</p>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[#4a5e7a] mb-2">All Options</p>
                        <div className="space-y-2">
                          {fullOrder.options?.map((opt: any) => {
                            const isRec = opt.action === item.recommended_action;
                            return (
                              <div key={opt.action} className={`rounded-xl border px-4 py-3 ${isRec ? "border-[#00d4c8]/30 bg-[#00d4c8]/5" : "border-[#1f2d44]"}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-[#e8eef8]">{opt.label}</span>
                                  {isRec && <span className="text-[9px] font-mono text-[#00d4c8] border border-[#00d4c8]/30 rounded px-1.5 py-0.5">RECOMMENDED</span>}
                                </div>
                                <p className="text-[11px] text-[#7a8fad] leading-relaxed mb-2">{opt.description}</p>
                                <div className="flex gap-4 text-[10px]">
                                  <div>
                                    <span className="text-[#22c55e] font-mono">+ </span>
                                    {opt.pros?.map((p: string, i: number) => <span key={i} className="text-[#22c55e]">{p}{i < opt.pros.length - 1 ? " · " : ""}</span>)}
                                  </div>
                                  <div>
                                    <span className="text-[#ef4444] font-mono">- </span>
                                    {opt.cons?.map((c: string, i: number) => <span key={i} className="text-[#ef4444]">{c}{i < opt.cons.length - 1 ? " · " : ""}</span>)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {fullOrder.total_value > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-[#7a8fad] font-mono">
                          <DollarSign className="w-3.5 h-3.5" />
                          Order value: ${fullOrder.total_value.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisruptionAnalyzer() {
  const { isOperator } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.disruptions()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  const analyze = async () => {
    if (!text.trim()) return;
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await api.analyzeDisruption(text);
      setResult(res);
      setHistory((h) => [res, ...h]);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (id: number) => {
    await api.deleteDisruption(id);
    setHistory((h) => h.filter((d) => d.id !== id));
  };

  const loadFromHistory = (d: any) => {
    setText(d.raw_text);
    setResult(d);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>
          Disruption Analyzer
        </h1>
        <p className="text-sm text-[#7a8fad] mt-1">
          Paste any disruption notice — supplier email, carrier alert, warehouse incident — and get a full impact assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="xl:col-span-2 space-y-4">
          {/* Example selectors */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[#4a5e7a] self-center">Examples:</span>
            {EXAMPLE_NOTICES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => { setText(ex.text); setResult(null); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#131929] border border-[#1f2d44] text-[#7a8fad] hover:text-[#e8eef8] hover:border-[#2a3d5a] transition-all"
              >
                {ex.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Paste disruption notice here...

Examples: supplier email about production halt, carrier delay notification, warehouse incident report..."
              className="w-full bg-[#0d1220] border border-[#1f2d44] rounded-xl px-4 py-3.5 text-sm text-[#e8eef8] placeholder-[#3a4e6a] resize-none transition-all font-[Inter,sans-serif] leading-relaxed"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {text && (
                <button
                  onClick={() => { setText(""); setResult(null); }}
                  className="text-[10px] text-[#4a5e7a] hover:text-[#7a8fad] font-mono transition-colors"
                >
                  clear
                </button>
              )}
              <span className="text-[10px] text-[#3a4e6a] font-mono">{text.length} chars</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/25 rounded-xl px-4 py-3 text-sm text-[#ef4444]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {isOperator ? (
            <button
              onClick={analyze}
              disabled={loading || !text.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00d4c8] hover:bg-[#00a89e] disabled:opacity-40 disabled:cursor-not-allowed text-[#080c14] font-semibold rounded-xl text-sm transition-all duration-150"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#080c14]/30 border-t-[#080c14] rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze Disruption
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#7a8fad] bg-[#131929] border border-[#1f2d44] rounded-xl px-4 py-3">
              <Info className="w-4 h-4" />
              You need Operator or Admin role to run analyses.
            </div>
          )}

          {/* Result */}
          {result && <ImpactCard result={result.analysis_result || result} />}
        </div>

        {/* History sidebar */}
        <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden h-fit">
          <div className="px-4 py-3.5 border-b border-[#1f2d44]">
            <span className="text-xs font-semibold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Analysis History</span>
          </div>
          {histLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#131929] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center px-4">
              <AlertTriangle className="w-7 h-7 text-[#1f2d44] mx-auto mb-2" />
              <p className="text-xs text-[#4a5e7a]">No analyses yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#111827] max-h-[600px] overflow-y-auto">
              {history.map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-start gap-2 px-4 py-3 hover:bg-[#131929] transition-colors cursor-pointer group"
                  onClick={() => loadFromHistory(d)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#e8eef8] truncate">{d.title || "Disruption Notice"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge value={d.severity} variant="severity" />
                      <span className="text-[10px] text-[#4a5e7a] font-mono">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {(d.affected_orders_count > 0 || d.affected_shipments_count > 0) && (
                      <p className="text-[10px] text-[#7a8fad] mt-0.5 font-mono">
                        {d.affected_orders_count} orders · {d.affected_shipments_count} shipments
                      </p>
                    )}
                  </div>
                  {isOperator && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteHistory(d.id); }}
                      className="p-1.5 rounded-lg text-[#4a5e7a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
