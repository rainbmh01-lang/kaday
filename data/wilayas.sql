CREATE TABLE IF NOT EXISTS wilayas (
    id INTEGER PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    desk_price INTEGER DEFAULT 0,
    home_price INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (1, '01', 'أدرار', 'Adrar', 600, 900, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (2, '02', 'الشلف', 'Chlef', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (3, '03', 'الأغواط', 'Laghouat', 450, 700, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (4, '04', 'أم البواقي', 'Oum El Bouaghi', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (5, '05', 'باتنة', 'Batna', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (6, '06', 'بجاية', 'Béjaïa', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (7, '07', 'بسكرة', 'Biskra', 450, 700, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (8, '08', 'بشار', 'Béchar', 600, 900, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (9, '09', 'البليدة', 'Blida', 300, 450, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (10, '10', 'البويرة', 'Bouira', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (11, '11', 'تمنراست', 'Tamanrasset', 700, 1100, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (12, '12', 'تبسة', 'Tébessa', 450, 650, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (13, '13', 'تلمسان', 'Tlemcen', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (14, '14', 'تيارت', 'Tiaret', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (15, '15', 'تيزي وزو', 'Tizi Ouzou', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (16, '16', 'الجزائر', 'Alger', 250, 400, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (17, '17', 'الجلفة', 'Djelfa', 450, 700, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (18, '18', 'جيجل', 'Jijel', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (19, '19', 'سطيف', 'Sétif', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (20, '20', 'سعيدة', 'Saïda', 450, 650, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (21, '21', 'سكيكدة', 'Skikda', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (22, '22', 'سيدي بلعباس', 'Sidi Bel Abbès', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (23, '23', 'عنابة', 'Annaba', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (24, '24', 'قالمة', 'Guelma', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (25, '25', 'قسنطينة', 'Constantine', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (26, '26', 'المدية', 'Médéa', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (27, '27', 'مستغانم', 'Mostaganem', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (28, '28', 'المسيلة', 'M''Sila', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (29, '29', 'معسكر', 'Mascara', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (30, '30', 'ورقلة', 'Ouargla', 500, 800, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (31, '31', 'وهران', 'Oran', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (32, '32', 'البيض', 'El Bayadh', 500, 800, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (33, '33', 'إليزي', 'Illizi', 700, 1100, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (34, '34', 'برج بوعريريج', 'Bordj Bou Arréridj', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (35, '35', 'بومرداس', 'Boumerdès', 300, 450, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (36, '36', 'الطارف', 'El Tarf', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (37, '37', 'تندوف', 'Tindouf', 700, 1100, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (38, '38', 'تيسمسيلت', 'Tissemsilt', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (39, '39', 'الوادي', 'El Oued', 500, 800, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (40, '40', 'خنشلة', 'Khenchela', 450, 650, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (41, '41', 'سوق أهراس', 'Souk Ahras', 450, 650, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (42, '42', 'تيبازة', 'Tipaza', 300, 450, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (43, '43', 'ميلة', 'Mila', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (44, '44', 'عين الدفلى', 'Aïn Defla', 350, 550, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (45, '45', 'النعامة', 'Naâma', 500, 800, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (46, '46', 'عين تموشنت', 'Aïn Témouchent', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (47, '47', 'غرداية', 'Ghardaïa', 500, 800, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (48, '48', 'غليزان', 'Relizane', 400, 600, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (49, '49', 'تيميمون', 'Timimoun', 600, 950, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (50, '50', 'برج باجي مختار', 'Bordj Badji Mokhtar', 700, 1150, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (51, '51', 'أولاد جلال', 'Ouled Djellal', 450, 700, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (52, '52', 'بني عباس', 'Béni Abbès', 600, 950, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (53, '53', 'عين صالح', 'In Salah', 650, 1000, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (54, '54', 'عين قزام', 'In Guezzam', 700, 1150, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (55, '55', 'تقرت', 'Touggourt', 500, 800, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (56, '56', 'جانت', 'Djanet', 700, 1150, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (57, '57', 'المغير', 'El M''Ghair', 500, 800, 1);
INSERT INTO wilayas (id, code, name_ar, name_fr, desk_price, home_price, is_active) VALUES (58, '58', 'المنيعة', 'El Meniaa', 550, 850, 1);
