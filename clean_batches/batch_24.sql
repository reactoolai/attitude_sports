INSERT INTO skus (product_id, sku_id, barcode, size, color, quantity, price, suggested_price, date_created, date_modified, date_received)
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000308', '7', 'JAUNE', 0, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000193', '8', 'BEIGE', 0, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000094', '8', 'NOIR', 0, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000414', '8', 'VERT', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000360', '8', 'ROSE', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000292', '8', 'JAUNE', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000285', '9', 'BEIGE', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000186', '9', 'NOIR', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000469', '9', 'VERT', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000353', '9', 'JAUNE', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000261', '10', 'BEIGE', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000162', '10', 'NOIR', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000452', '10', 'VERT', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000346', '10', 'JAUNE', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000254', '11', 'BEIGE', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000155', '11', 'NOIR', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000445', '11', 'VERT', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000339', '11', 'JAUNE', 2, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000247', '12', 'BEIGE', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000148', '12', 'NOIR', 0, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000438', '12', 'VERT', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000322', '12', 'JAUNE', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000230', '13', 'BEIGE', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000131', '13', 'NOIR', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000005051', '13', 'VERT', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '73455'), '73455', '5053000000315', '13', 'JAUNE', 1, 80.0, 80.0, '20250326'::date, NULL::date, '20250408'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'CAF304.406.O.K'), 'CAF304.406.O.K', '5053000024083', '', '', 0, 11.0, 11.0, '20260326'::date, NULL::date, '20260326'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'CAF306.050.O.K'), 'CAF306.050.O.K', '5053000024090', '', '', 2, 11.0, 11.0, '20260326'::date, NULL::date, '20260326'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'CAF307.422.O.K'), 'CAF307.422.O.K', '5053000024106', '', '', 2, 11.0, 11.0, '20260326'::date, NULL::date, '20260326'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'CAF308.100.O.K'), 'CAF308.100.O.K', '5053000024113', '', '', 2, 11.0, 11.0, '20260326'::date, NULL::date, '20260326'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'KRF309.001.O.K'), 'KRF309.001.O.K', '5053000024120', '', '', 1, 11.0, 11.0, '20260326'::date, NULL::date, '20260326'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'SAC'), 'SAC', '5053000005112', '', '', -3, 1.0, 1.0, '20250522'::date, NULL::date, NULL::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'SXBB32'), 'SXBB32', '5053000005105', 'XS', 'NOIR', 4, 40.0, 40.0, '20250422'::date, '20260526'::date, '20250422'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'SXBB32'), 'SXBB32', '5053000005068', 'S', 'NOIR', 19, 40.0, 40.0, '20250422'::date, '20260526'::date, '20250422'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'SXBB32'), 'SXBB32', '5053000005075', 'M', 'NOIR', 10, 40.0, 40.0, '20250422'::date, '20260526'::date, '20250422'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'SXBB32'), 'SXBB32', '5053000005082', 'L', 'NOIR', 19, 40.0, 40.0, '20250422'::date, '20260526'::date, '20250422'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'SXBB32'), 'SXBB32', '5053000005099', 'XL', 'NOIR', 0, 40.0, 40.0, '20250422'::date, '20260526'::date, '20250422'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'TEF301.402.O.K'), 'TEF301.402.O.K', '5053000024137', '', '', 3, 11.0, 11.0, '20260326'::date, NULL::date, '20260326'::date
UNION ALL
SELECT (SELECT id FROM products WHERE numref = 'TEF302.050.O.K'), 'TEF302.050.O.K', '5053000024144', '', '', 2, 11.0, 11.0, '20260326'::date, NULL::date, '20260326'::date;