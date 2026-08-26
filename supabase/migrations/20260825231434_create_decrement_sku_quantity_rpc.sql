/*
# Create decrement_sku_quantity RPC function

1. New Functions
- `decrement_sku_quantity(sku_uuid uuid, qty integer)` — atomically decrements a SKU's quantity by the ordered amount, floor at 0.

2. Security
- SECURITY DEFINER so edge functions can call it with service_role.
- No change to existing tables or policies.
*/

CREATE OR REPLACE FUNCTION decrement_sku_quantity(sku_uuid uuid, qty integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE skus
  SET quantity = GREATEST(0, quantity - qty)
  WHERE id = sku_uuid;
$$;