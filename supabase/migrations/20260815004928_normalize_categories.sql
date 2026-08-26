-- Normalize category values: remove accents, uppercase
UPDATE products SET category = 'GARCON' WHERE category = 'Garçon';
UPDATE products SET category = 'FILLE' WHERE category = 'Fille';
UPDATE products SET category = 'HOMME' WHERE category = 'Homme';
UPDATE products SET category = 'FEMME' WHERE category = 'Femme';
UPDATE products SET category = 'UNISEXE' WHERE category = 'Unisexe';
-- Assign empty-category products to UNISEXE
UPDATE products SET category = 'UNISEXE' WHERE category = '' OR category IS NULL;
