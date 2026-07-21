-- 부동산 실거래: 지역별 월별 통계
CREATE TABLE realestate_regions (
  id            BIGSERIAL PRIMARY KEY,
  sigungu_code  VARCHAR(5) NOT NULL,
  region_name   VARCHAR(50) NOT NULL,
  property_type VARCHAR(20) NOT NULL DEFAULT '아파트',
  trade_type    VARCHAR(10) NOT NULL,  -- '매매' or '전월세'
  year_month    VARCHAR(6) NOT NULL,   -- '202607'
  avg_price     FLOAT,
  median_price  FLOAT,
  min_price     INTEGER,
  max_price     INTEGER,
  trade_count   INTEGER DEFAULT 0,
  price_change_pct FLOAT,

  UNIQUE (sigungu_code, property_type, trade_type, year_month)
);

CREATE INDEX idx_realestate_regions_sigungu ON realestate_regions(sigungu_code);
CREATE INDEX idx_realestate_regions_month ON realestate_regions(year_month);

-- 부동산 실거래: 단지별 월별 통계
CREATE TABLE realestate_complexes (
  id            BIGSERIAL PRIMARY KEY,
  sigungu_code  VARCHAR(5) NOT NULL,
  region_name   VARCHAR(50),
  apt_name      VARCHAR(100) NOT NULL,
  property_type VARCHAR(20) NOT NULL DEFAULT '아파트',
  trade_type    VARCHAR(10) NOT NULL DEFAULT '매매',
  year_month    VARCHAR(6) NOT NULL,
  avg_price     FLOAT,
  median_price  FLOAT,
  min_price     INTEGER,
  max_price     INTEGER,
  trade_count   INTEGER DEFAULT 0,
  price_change_pct FLOAT,

  UNIQUE (sigungu_code, apt_name, property_type, trade_type, year_month)
);

CREATE INDEX idx_realestate_complexes_name ON realestate_complexes(apt_name);
CREATE INDEX idx_realestate_complexes_region ON realestate_complexes(sigungu_code);
CREATE INDEX idx_realestate_complexes_month ON realestate_complexes(year_month);

-- 부동산 실거래: 개별 거래 레코드 (상세 차트용)
CREATE TABLE realestate_trades (
  id            BIGSERIAL PRIMARY KEY,
  sigungu_code  VARCHAR(5) NOT NULL,
  region_name   VARCHAR(50),
  property_type VARCHAR(20) NOT NULL DEFAULT '아파트',
  trade_type    VARCHAR(10) NOT NULL,
  apt_name      VARCHAR(100),
  dong          VARCHAR(50),
  exclusive_area FLOAT,
  floor         INTEGER,
  build_year    INTEGER,
  deal_date     DATE NOT NULL,
  price         INTEGER,
  deposit       INTEGER,
  monthly_rent  INTEGER,
  collected_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_realestate_trades_unique ON realestate_trades (sigungu_code, apt_name, exclusive_area, floor, deal_date, price, COALESCE(deposit, 0));

CREATE INDEX idx_realestate_trades_apt ON realestate_trades(apt_name);
CREATE INDEX idx_realestate_trades_region ON realestate_trades(sigungu_code);
CREATE INDEX idx_realestate_trades_date ON realestate_trades(deal_date);
CREATE INDEX idx_realestate_trades_type ON realestate_trades(property_type, trade_type);
