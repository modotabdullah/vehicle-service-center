-- ========================================================
-- VEHICLE SERVICE CENTER TRIGGERS, VIEWS & PROCEDURES
-- Database: vehicle_service_prod
-- ========================================================

-- 1. Trigger to automatically reduce part inventory stock when parts are used in a job
CREATE OR REPLACE FUNCTION trg_update_part_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_part
    SET quantity_in_stock = quantity_in_stock - NEW.quantity_used
    WHERE part_id = NEW.part_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_part_stock ON job_part_usage;
CREATE TRIGGER trigger_update_part_stock
AFTER INSERT ON job_part_usage
FOR EACH ROW
EXECUTE FUNCTION trg_update_part_stock();

-- 2. Trigger for auditing invoice modifications
CREATE OR REPLACE FUNCTION trg_audit_invoice_changes()
RETURNS TRIGGER AS $$
DECLARE
    acting_user_id INT;
BEGIN
    acting_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INT;

    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, operation, table_name, record_id, old_value, new_value)
        VALUES (acting_user_id, 'update', 'invoice', OLD.invoice_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, operation, table_name, record_id, old_value, new_value)
        VALUES (acting_user_id, 'delete', 'invoice', OLD.invoice_id, row_to_json(OLD)::jsonb, NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_invoice_changes ON invoice;
CREATE TRIGGER trigger_audit_invoice_changes
AFTER UPDATE OR DELETE ON invoice
FOR EACH ROW
EXECUTE FUNCTION trg_audit_invoice_changes();

-- 3. View: Active service jobs
CREATE OR REPLACE VIEW active_service_jobs_view AS
SELECT
    sj.job_id,
    sj.status,
    sj.job_date,
    sj.total_labor_cost,
    sj.total_parts_cost,
    v.vehicle_id,
    v.vin,
    v.license_plate,
    v.make,
    v.model,
    v.year,
    c.customer_id,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    m.mechanic_id,
    m.full_name AS mechanic_name,
    m.specialization
FROM service_job sj
JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
JOIN customer c ON c.customer_id = v.customer_id
LEFT JOIN mechanic m ON m.mechanic_id = sj.mechanic_id
WHERE sj.status IN ('pending', 'in_progress');

-- 4. View: Low stock parts
CREATE OR REPLACE VIEW low_stock_parts_view AS
SELECT part_id, part_name, part_number, quantity_in_stock, reorder_level, unit_price
FROM inventory_part
WHERE quantity_in_stock <= reorder_level;

-- 5. Helper Function: Calculate Job Total
CREATE OR REPLACE FUNCTION calculate_job_total(p_job_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_labor NUMERIC;
    v_parts NUMERIC;
BEGIN
    SELECT COALESCE(SUM(labor_cost), 0) INTO v_labor FROM service_item WHERE job_id = p_job_id;
    SELECT COALESCE(SUM(subtotal), 0) INTO v_parts FROM job_part_usage WHERE job_id = p_job_id;
    RETURN v_labor + v_parts;
END;
$$ LANGUAGE plpgsql;

-- 6. Helper Function: Customer Total Spend
CREATE OR REPLACE FUNCTION get_customer_total_spend(p_customer_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(p.amount_paid), 0)
    INTO v_total
    FROM payment p
    JOIN invoice i ON i.invoice_id = p.invoice_id
    JOIN service_job sj ON sj.job_id = i.job_id
    JOIN vehicle v ON v.vehicle_id = sj.vehicle_id
    WHERE v.customer_id = p_customer_id;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- 7. Stored Procedure: Create Service Job
CREATE OR REPLACE PROCEDURE create_service_job(
    p_vehicle_id INT,
    p_customer_id INT,
    p_mechanic_id INT DEFAULT NULL,
    INOUT p_job_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_owner_id INT;
    v_mechanic_id INT;
BEGIN
    SELECT customer_id INTO v_owner_id FROM vehicle WHERE vehicle_id = p_vehicle_id;

    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Vehicle % does not exist', p_vehicle_id;
    END IF;

    IF v_owner_id <> p_customer_id THEN
        RAISE EXCEPTION 'Vehicle % does not belong to customer %', p_vehicle_id, p_customer_id;
    END IF;

    IF p_mechanic_id IS NOT NULL THEN
        SELECT mechanic_id INTO v_mechanic_id FROM mechanic WHERE mechanic_id = p_mechanic_id AND status = 'active';
        IF v_mechanic_id IS NULL THEN
            RAISE EXCEPTION 'Mechanic % is not available', p_mechanic_id;
        END IF;
    ELSE
        SELECT mechanic_id INTO v_mechanic_id FROM mechanic WHERE status = 'active' ORDER BY mechanic_id LIMIT 1;
        IF v_mechanic_id IS NULL THEN
            RAISE EXCEPTION 'No active mechanics available';
        END IF;
    END IF;

    INSERT INTO service_job (vehicle_id, mechanic_id, status)
    VALUES (p_vehicle_id, v_mechanic_id, 'pending')
    RETURNING job_id INTO p_job_id;
END;
$$;

-- 8. Stored Procedure: Process Invoice Payment
CREATE OR REPLACE PROCEDURE process_invoice_payment(
    p_invoice_id INT,
    p_amount NUMERIC,
    p_method VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_grand_total NUMERIC;
    v_paid_so_far NUMERIC;
    v_new_total_paid NUMERIC;
BEGIN
    SELECT grand_total INTO v_grand_total FROM invoice WHERE invoice_id = p_invoice_id;

    IF v_grand_total IS NULL THEN
        RAISE EXCEPTION 'Invoice % does not exist', p_invoice_id;
    END IF;

    SELECT COALESCE(SUM(amount_paid), 0) INTO v_paid_so_far
    FROM payment WHERE invoice_id = p_invoice_id;

    v_new_total_paid := v_paid_so_far + p_amount;

    INSERT INTO payment (invoice_id, amount_paid, payment_method)
    VALUES (p_invoice_id, p_amount, p_method);

    IF v_new_total_paid >= v_grand_total THEN
        UPDATE invoice SET payment_status = 'paid' WHERE invoice_id = p_invoice_id;
    ELSE
        UPDATE invoice SET payment_status = 'partial' WHERE invoice_id = p_invoice_id;
    END IF;
END;
$$;
