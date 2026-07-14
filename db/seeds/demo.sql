-- Demo seed for the preview branch
-- Generates a full year of deterministic synthetic sales history (Mon–Sat, 2026).
-- Run ONLY against the preview Neon branch, never production or development.
--
-- Usage:
--   psql "$PREVIEW_DATABASE_URL" -f db/seeds/demo.sql

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL statement_timeout = '5min';

DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM sales_sessions;
UPDATE products SET last_sold_at = NULL;

DO $$
DECLARE
  session_day   DATE;
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
  -- Keep repeat runs stable so screenshots and portfolio metrics do not drift.
  PERFORM setseed(0.2026);

  FOR session_day IN
    SELECT generated_day::DATE
    FROM generate_series(
      DATE '2026-01-01',
      DATE '2026-12-31',
      INTERVAL '1 day'
    ) AS generated_day
    WHERE EXTRACT(ISODOW FROM generated_day) < 7
  LOOP
    s_id          := gen_random_uuid();
    open_ts       := session_day::TIMESTAMP + '09:00:00'::INTERVAL;
    session_total := 0;

    INSERT INTO sales_sessions (id, session_date, session_number, status, opened_at, closed_at)
    VALUES (
      s_id, session_day, 1, 'closed',
      open_ts,
      session_day::TIMESTAMP + '19:30:00'::INTERVAL
    );

    -- Saturdays are busier
    n_sales := CASE EXTRACT(ISODOW FROM session_day)
      WHEN 6 THEN 15 + floor(random() * 8)::INT
      ELSE        10 + floor(random() * 8)::INT
    END;

    -- Back-to-school season has more traffic; January and July get a smaller lift.
    IF EXTRACT(MONTH FROM session_day) IN (8, 9) THEN
      n_sales := n_sales + 8;
    ELSIF EXTRACT(MONTH FROM session_day) IN (1, 7) THEN
      n_sales := n_sales + 3;
    END IF;

    FOR j IN 1..n_sales LOOP
      sale_id    := gen_random_uuid();
      sale_total := 0;
      -- Spread transactions evenly across the ten-hour business day.
      sale_ts    := open_ts + make_interval(mins => (j * 600) / (n_sales + 1));

      INSERT INTO sales (id, session_id, subtotal, total, payment_amount, change_amount, created_at)
      VALUES (sale_id, s_id, 0, 0, 0, 0, sale_ts);

      n_items := 1 + floor(random() * 4)::INT;

      FOR k IN 1..n_items LOOP
        SELECT id, name, price::NUMERIC(10,2)
        INTO   p_id, p_name, p_price
        FROM   products
        WHERE  is_active = true
        ORDER  BY random()
        LIMIT  1;

        IF NOT FOUND OR p_id IS NULL THEN
          RAISE EXCEPTION 'No active products available for seeding. Ensure products exist before running this script.';
        END IF;

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
      SET    subtotal = sale_total,
             total = sale_total,
             payment_amount = payment,
             change_amount = change_amt
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
