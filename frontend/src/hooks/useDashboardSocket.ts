"use client";

import { useEffect, useRef } from "react";
import { useShopStore } from "@/store/useShopStore";

const WS_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ?? "ws://localhost:8000";

/**
 * useDashboardSocket
 *
 * Maintains a persistent WebSocket connection to /ws/dashboard/{shop_id}.
 * Receives server-pushed alert and forecast updates and writes them to
 * the Zustand shop store so the dashboard re-renders automatically.
 *
 * Automatically reconnects on disconnect (max 5 retries with back-off).
 */
export function useDashboardSocket(shopId: number | null) {
  const { addAlert, setProducts } = useShopStore();

  const wsRef      = useRef<WebSocket | null>(null);
  const retryRef   = useRef(0);
  const maxRetries = 5;
  const timerId    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shopId) return;

    function connect() {
      const ws = new WebSocket(`${WS_BASE}/ws/dashboard/${shopId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0; // reset retry counter on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type: string;
            payload?: unknown;
          };

          switch (data.type) {
            case "alert": {
              // New or updated alert pushed by APScheduler
              const alert = data.payload as {
                id: number;
                product_name: string;
                level: "HIGH" | "MEDIUM" | "LOW";
                reason: string;
              };
              addAlert(alert);
              break;
            }

            case "forecast_ready": {
              // ML retrain finished — refresh dashboard products
              // Products are re-fetched via REST since WS only signals readiness
              import("@/lib/api").then(({ getDashboard }) =>
                getDashboard()
                  .then((d) => {
                    const data = d as { products?: unknown[] };
                    if (Array.isArray(data.products)) {
                      setProducts(data.products as Parameters<typeof setProducts>[0]);
                    }
                  })
                  .catch(console.error)
              );
              break;
            }

            default:
              break;
          }
        } catch {
          // Non-JSON frame — ignore
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (retryRef.current < maxRetries) {
          const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
          retryRef.current += 1;
          timerId.current = setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [shopId, addAlert, setProducts]);
}
