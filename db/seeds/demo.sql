-- Demo seed for preview branch
-- Generates ~3 weeks of realistic sales history (Mon–Sat, May 1–23 2026)
-- Run ONLY against the preview Neon branch, never production.
--
-- Usage:
--   psql $PREVIEW_DATABASE_URL -f db/seeds/demo.sql

BEGIN;

DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM sales_sessions;
UPDATE products SET last_sold_at = NULL;

DO $$
DECLARE
  session_dates DATE[] := ARRAY[
    '2026-05-01', '2026-05-02',
    '2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09',
    '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16',
    '2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23'
  ]::DATE[];
  s_id          UUID;
  sale_id       UUID;
  n_sales       INT;
  n_items       INT;
  p_id          UUID;
  p_name        TEXT;
  p_price       NUMERIC(10,2);
  sale_total    NUMERIC(10,2);
  session_total NUMERIC(10,2);
  subtotal      NUMERIC(10,2);
  qty           INT;
  payment       NUMERIC(10,2);
  change_amt    NUMERIC(10,2);
  counted       NUMERIC(10,2);
  open_ts       TIMESTAMP;
  sale_ts       TIMESTAMP;
BEGIN
  FOR i IN 1..array_length(session_dates, 1) LOOP
    s_id          := gen_random_uuid();
    open_ts       := session_dates[i]::TIMESTAMP + '09:00:00'::INTERVAL;
    session_total := 0;

    INSERT INTO sales_sessions (id, session_date, session_number, status, opened_at, closed_at)
    VALUES (
      s_id, session_dates[i], 1, 'closed',
      open_ts,
      session_dates[i]::TIMESTAMP + '19:30:00'::INTERVAL
    );

    -- Saturdays are busier
    n_sales := CASE EXTRACT(DOW FROM session_dates[i])
      WHEN 6 THEN 15 + floor(random() * 8)::INT
      ELSE        10 + floor(random() * 8)::INT
    END;

    FOR j IN 1..n_sales LOOP
      sale_id    := gen_random_uuid();
      sale_total := 0;
      sale_ts    := open_ts + (j * 38 || ' minutes')::INTERVAL;

      INSERT INTO sales (id, session_id, total, payment_amount, change_amount, created_at)
      VALUES (sale_id, s_id, 0, 0, 0, sale_ts);

      n_items := 1 + floor(random() * 4)::INT;

      FOR k IN 1..n_items LOOP
        SELECT id, name, price::NUMERIC(10,2)
        INTO   p_id, p_name, p_price
        FROM   products
        WHERE  is_active = true
        ORDER  BY random()
        LIMIT  1;

        qty        := CASE WHEN random() > 0.75 THEN 2 ELSE 1 END;
        subtotal   := p_price * qty;
        sale_total := sale_total + subtotal;

        INSERT INTO sale_items (id, sale_id, product_id, product_name, unit_price, quantity, subtotal)
        VALUES (gen_random_uuid(), sale_id, p_id, p_name, p_price, qty, subtotal);
      END LOOP;

      -- Realistic Mexican bill denominations
      payment := CASE
        WHEN sale_total <=  50 THEN  50
        WHEN sale_total <= 100 THEN 100
        WHEN sale_total <= 200 THEN 200
        WHEN sale_total <= 500 THEN 500
        ELSE (ceil(sale_total / 500) * 500)::NUMERIC(10,2)
      END;
      change_amt := payment - sale_total;

      UPDATE sales
      SET    total = sale_total, payment_amount = payment, change_amount = change_amt
      WHERE  id = sale_id;

      session_total := session_total + sale_total;
    END LOOP;

    -- Counted cash: realistic minor discrepancy (±$30)
    counted := session_total + ((floor(random() * 7) - 3) * 10)::NUMERIC(10,2);

    UPDATE sales_sessions
    SET system_total  = session_total,
        counted_total = counted,
        difference    = counted - session_total
    WHERE id = s_id;

  END LOOP;

  -- Propagate last_sold_at back to products
  UPDATE products p
  SET last_sold_at = (
    SELECT MAX(s.created_at)
    FROM   sale_items si
    JOIN   sales s ON s.id = si.sale_id
    WHERE  si.product_id = p.id
  )
  WHERE EXISTS (
    SELECT 1 FROM sale_items si WHERE si.product_id = p.id
  );

END $$;

COMMIT;
