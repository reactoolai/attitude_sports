INSERT INTO skus (product_id, sku_id, barcode, size, color, quantity, price, suggested_price, date_created, date_modified, date_received)
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000012639', '8', 'BLANC', 1, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014176', '8.5', 'NOIR', 1, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000012554', '8.5', 'BLANC', 1, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014169', '9', 'NOIR', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000012561', '9', 'BLANC', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014152', '9.5', 'NOIR', 1, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000012578', '9.5', 'BLANC', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014145', '10', 'NOIR', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000012585', '10', 'BLANC', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014138', '10.5', 'NOIR', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000012592', '10.5', 'BLANC', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014121', '11', 'NOIR', 1, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000012608', '11', 'BLANC', 0, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014183', '11.5', 'NOIR', 1, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '3028486'), '3028486', '5053000014190', '12', 'NOIR', 1, 99.0, 99.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '373354'), '373354', '0', '', '', 0, 70.0, 70.0, '20250714'::date, NULL::date, NULL::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53099118'::date), '53099118'::date, '5053000013643', 'S', 'BLEU', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53298101'::date), '53298101'::date, '5053000013667', 'L', 'BLANC', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53298101'::date), '53298101'::date, '5053000013650', 'XL', 'BLANC', 2, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53298602'::date), '53298602'::date, '5053000013674', 'XXL', 'BLEU', 1, 129.99, 129.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53298802'::date), '53298802'::date, '5053000013698', '34', 'MARINE', 0, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53298802'::date), '53298802'::date, '5053000013681', '38', 'MARINE', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53298812'::date), '53298812'::date, '5053000013704', '38', 'BLEU', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53379001'::date), '53379001'::date, '5053000013728', 'S', 'BLANC', 1, 99.99, 99.99, '20250729'::date, '20260526'::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53379001'::date), '53379001'::date, '5053000013711', 'L', 'BLANC', 1, 99.99, 99.99, '20250729'::date, '20260526'::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53379102'::date), '53379102'::date, '5053000013735', 'S', 'BLEU', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53452701'::date), '53452701'::date, '5053000013742', 'M', 'GRIS', 1, 99.99, 99.99, '20250729'::date, '20250729'::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53552213'::date), '53552213'::date, '5053000013759', '32', 'VERT', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53552213'::date), '53552213'::date, '5053000013766', '33', 'VERT', 0, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53552213'::date), '53552213'::date, '5053000014244', '34', 'VERT', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53552214'::date), '53552214'::date, '5053000013773', '32', 'ROSE', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53552214'::date), '53552214'::date, '5053000013780', '34', 'ROSE', 2, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53744704'::date), '53744704'::date, '5053000013810', 'S', 'VERT', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53744704'::date), '53744704'::date, '5053000013803', 'M', 'VERT', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53744704'::date), '53744704'::date, '5053000013797', 'XL', 'VERT', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53745003'::date), '53745003'::date, '5053000013834', 'S', 'ROSE', 2, 109.99, 109.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53745003'::date), '53745003'::date, '5053000013827', 'M', 'ROSE', 0, 109.99, 109.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53745801'::date), '53745801'::date, '5053000013841', 'S', 'MARINE', 1, 109.99, 109.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53746701'::date), '53746701'::date, '5053000013858', 'S', 'GRIS', 1, 109.99, 109.9, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53870801'::date), '53870801'::date, '5053000013872', 'S', 'NOIR', 0, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53870801'::date), '53870801'::date, '5053000013865', 'M', 'NOIR', 0, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53870804'::date), '53870804'::date, '5053000013902', 'S', 'VERT', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53870804'::date), '53870804'::date, '5053000013896', 'M', 'VERT', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53870804'::date), '53870804'::date, '5053000013889', 'XL', 'VERT', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53870807'::date), '53870807'::date, '5053000013926', 'S', 'ROSE', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53870807'::date), '53870807'::date, '5053000013919', 'M', 'ROSE', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53875201'::date), '53875201'::date, '5053000013940', 'S', 'BLANC', 2, 119.99, 119.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53875201'::date), '53875201'::date, '5053000013933', 'M', 'BLANC', 1, 119.99, 119.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53899208'::date), '53899208'::date, '5053000013964', 'S', 'ROSE', 1, 109.99, 109.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53899208'::date), '53899208'::date, '5053000013957', 'M', 'ROSE', 1, 109.99, 109.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '53899703'::date), '53899703'::date, '5053000013971', 'S', 'ROSE', 1, 109.99, 109.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59911516'::date), '59911516'::date, '5053000013995', 'S', 'BLANC', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59911516'::date), '59911516'::date, '5053000013988', 'M', 'BLANC', 1, 99.99, 99.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59924628'::date), '59924628'::date, '5053000014008', '34', 'BLEU', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59924633'::date), '59924633'::date, '5053000014015', '32', 'CORAIL', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59924633'::date), '59924633'::date, '5053000014046', '34', 'CORAIL', 2, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59924633'::date), '59924633'::date, '5053000014039', '36', 'CORAIL', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59924633'::date), '59924633'::date, '5053000014022', '38', 'CORAIL', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59924635'::date), '59924635'::date, '5053000014053', '34', 'ROUGE', 2, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '59924635'::date), '59924635'::date, '5053000014060', '38', 'ROUGE', 1, 89.99, 89.99, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000004825', 'S', 'BLEU', 0, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000020641', 'S', 'BEIGE', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000021389', 'S', 'ORANGE', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000004832', 'M', 'BLEU', 0, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000020658', 'M', 'BEIGE', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000021372', 'M', 'ORANGE', 2, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000004849', 'L', 'BLEU', 0, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000020665', 'L', 'BEIGE', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000021365', 'L', 'ORANGE', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000004856', 'XL', 'BLEU', 0, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000020672', 'XL', 'BEIGE', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000021358', 'XL', 'ORANGE', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000000'), '6000000', '5053000004863', 'XXL', 'BLEU', 1, 35.0, 35.0, '20250404'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000264'), '6000264', '5053000010277', 'S', 'BLANC', 1, 40.0, 40.0, '20250326'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000264'), '6000264', '5053000004870', 'S', 'ROSE', 0, 40.0, 40.0, '20250326'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000264'), '6000264', '5053000010260', 'M', 'BLANC', 1, 40.0, 40.0, '20250326'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000264'), '6000264', '5053000004887', 'M', 'ROSE', 0, 40.0, 40.0, '20250326'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000264'), '6000264', '5053000010253', 'L', 'BLANC', 1, 40.0, 40.0, '20250326'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000264'), '6000264', '5053000004894', 'L', 'ROSE', 1, 40.0, 40.0, '20250326'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000264'), '6000264', '5053000004900', 'XL', 'ROSE', 0, 40.0, 40.0, '20250326'::date, NULL::date, '20250408'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000397'), '6000397', '5053000005358', '', '', 9, 55.0, 55.0, '20250714'::date, NULL::date, '20250716'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000519'), '6000519', '5053000011236', '', '', 1, 30.0, 30.0, '20250724'::date, NULL::date, '20250724'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000522'), '6000522', '5053000014671', 'M', 'BEIGE', 1, 180.0, 180.0, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000522'), '6000522', '5053000014688', 'L', 'BEIGE', 1, 180.0, 180.0, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000522'), '6000522', '5053000014237', 'XL', 'BEIGE', 0, 180.0, 180.0, '20250729'::date, NULL::date, '20250729'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023604', 'XS', 'BLEU', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023413', 'XS', 'BEIGE', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000015203', 'XS', 'NOIR', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023611', 'S', 'BLEU', 0, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023420', 'S', 'BEIGE', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000015210', 'S', 'NOIR', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023628', 'M', 'BLEU', 2, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023437', 'M', 'BEIGE', 2, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000018303', 'M', 'NOIR', 2, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023635', 'L', 'BLEU', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000023444', 'L', 'BEIGE', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000640'), '6000640', '5053000018297', 'L', 'NOIR', 1, 50.0, 50.0, '20260105'::date, NULL::date, '20260105'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000642'), '6000642', '5053000017962', 'XS', 'BEIGE', 1, 55.0, 55.0, '20260129'::date, NULL::date, '20260129'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000642'), '6000642', '5053000017979', 'S', 'BEIGE', 0, 55.0, 55.0, '20260129'::date, NULL::date, '20260129'::date)
UNION ALL
SELECT (SELECT id FROM products WHERE numref = '6000642'), '6000642', '5053000017986', 'M', 'BEIGE', 0, 55.0, 55.0, '20260129'::date, NULL::date, '20260129'::date);