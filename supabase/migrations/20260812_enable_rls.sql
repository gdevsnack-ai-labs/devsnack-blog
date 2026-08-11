-- RLS 활성화: 누구나 anon 키로 읽기/수정/삭제 가능하던 6개 테이블 보안 처리
-- anon: SELECT만 허용 (블로그 공개 조회 유지), 쓰기/수정/삭제 차단
-- service_role(BYPASSRLS): 파이프라인 insert/update 영향 없음

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realestate_complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realestate_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realestate_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_posts" ON public.posts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_predictions" ON public.predictions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_stock_predictions" ON public.stock_predictions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_realestate_complexes" ON public.realestate_complexes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_realestate_regions" ON public.realestate_regions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_realestate_trades" ON public.realestate_trades FOR SELECT TO anon USING (true);
