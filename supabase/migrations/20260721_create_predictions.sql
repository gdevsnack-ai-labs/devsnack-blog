
CREATE TABLE IF NOT EXISTS predictions (
  id          SERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  session     TEXT NOT NULL,
  direction       TEXT,
  kospi_close     INTEGER,
  kospi_target    TEXT,
  prediction_raw  TEXT,
  actual_kospi_close  INTEGER,
  actual_direction    TEXT,
  accuracy_score      REAL,
  is_correct          BOOLEAN,
  fail_reason     TEXT,
  improvement     TEXT,
  analysis_raw    TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_predictions_unique ON predictions(date, session);
