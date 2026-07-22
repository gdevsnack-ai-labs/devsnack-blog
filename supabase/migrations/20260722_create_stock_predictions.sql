-- StockPulse AI — 개별 종목 예측 저장 테이블
-- Supabase SQL Editor에서 이 파일 내용을 붙여넣고 실행

CREATE TABLE IF NOT EXISTS stock_predictions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER,
  up_probability REAL,
  confidence TEXT,
  tree_prob REAL,
  lstm_prob REAL,
  rank_pct INTEGER,
  direction TEXT,

  -- Actual results (after 5 trading days)
  actual_return REAL,
  kospi_return REAL,
  outperformed BOOLEAN,
  is_correct BOOLEAN,

  evaluated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(date, ticker)
);

CREATE INDEX IF NOT EXISTS idx_stock_pred_date ON stock_predictions(date);
CREATE INDEX IF NOT EXISTS idx_stock_pred_evaluated ON stock_predictions(evaluated_at);
CREATE INDEX IF NOT EXISTS idx_stock_pred_ticker ON stock_predictions(ticker);
