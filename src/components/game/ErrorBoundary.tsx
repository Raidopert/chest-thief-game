"use client";

import React from "react";

interface State { hasError: boolean; error?: Error; }
interface Props { children: React.ReactNode; onReset?: () => void; }

// Error Boundary — страховка от белого экрана.
// Если любой дочерний компонент упадёт — показываем fallback с кнопкой сброса.
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) this.props.onReset();
    else window.location.reload();
  };

  handleHardReset = () => {
    if (confirm("Сбросить весь прогресс? Это удалит сохранение.")) {
      try {
        localStorage.removeItem("chest-thief-game-v4");
        localStorage.removeItem("chest-thief-game-v3");
      } catch {}
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at 50% 0%, #2a2530 0%, #15131c 50%, #08060a 100%)" }}>
          <div className="max-w-md w-full rounded-2xl border-2 border-red-700/60 bg-[#15131c] p-6 text-center shadow-[0_0_40px_rgba(220,38,38,0.4)]">
            <div className="text-5xl mb-3">💀</div>
            <h2 className="text-xl font-black text-zinc-100 uppercase tracking-wider mb-2">
              Тёмная сила повергла героя
            </h2>
            <p className="text-xs text-zinc-400 font-mono mb-4">
              Произошла ошибка. Прогресс сохранён — можно продолжить.
            </p>
            {this.state.error && (
              <details className="text-left mb-4 p-2 rounded bg-black/40 border border-zinc-700/50">
                <summary className="text-[10px] text-zinc-500 cursor-pointer font-mono uppercase tracking-wider">
                  Детали ошибки
                </summary>
                <pre className="text-[10px] text-red-400 font-mono mt-2 whitespace-pre-wrap break-all">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack?.slice(0, 500)}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <button onClick={this.handleReload} className="flex-1 px-3 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-zinc-100 text-xs font-bold transition-colors">
                ⟳ Перезагрузить
              </button>
              <button onClick={this.handleHardReset} className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors border border-zinc-700">
                Сбросить сейв
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
