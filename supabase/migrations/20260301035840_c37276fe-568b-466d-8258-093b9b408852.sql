
-- Seed blog_posts
INSERT INTO public.blog_posts (title, slug, excerpt, body, date) VALUES
('Off the Dome: The Freestyle Tapes', 'off-the-dome-freestyle-tapes', 'There is no premeditation. The recent drops—''Poppin'' and ''Long Kiss Goodnight''—were recorded in single takes. The studio is a vacuum. The mic captures the exact frequency of the room. No overwriting, no polishing the edges to make them comfortable. The raw vocal is the final architecture. The imperfections are intentional. More visuals dropping soon. Watch the space.', 'There is no premeditation. The recent drops—''Poppin'' and ''Long Kiss Goodnight''—were recorded in single takes. The studio is a vacuum. The mic captures the exact frequency of the room. No overwriting, no polishing the edges to make them comfortable. The raw vocal is the final architecture. The imperfections are intentional.

This is what happens when you strip the process back to zero. No stacking, no layering, no second-guessing. You step up to the mic and whatever comes out is what lives. The energy in those recordings is unrepeatable — that''s the whole point.

More visuals dropping soon. Watch the space.', '2026.02.27'),
('The Live Room: No Backing Tracks', 'the-live-room-no-backing-tracks', 'Stripped down. No safety nets. The upcoming live sessions are strictly vocal, mic, and monitors. We are cutting out the noise to focus on the frequency.', 'Stripped down. No safety nets. The upcoming live sessions are strictly vocal, mic, and monitors. We are cutting out the noise to focus on the frequency. The sound is getting heavier, the delivery is getting sharper. Pure energy. Visuals incoming.', '2026.02.25'),
('''Absence'' Visual Identity & Merch', 'absence-visual-identity-merch', 'The new visual identity is live. Heavy canvas, raw prints, pure utilitarian function. The merch is built to reflect the exact energy of the studio.', 'The new visual identity is live. Heavy canvas, raw prints, pure utilitarian function. The merch is built to reflect the exact energy of the studio—uncompromising and built to last. Limited run on the ''Absence'' long sleeves. Check the objects tab.', '2026.02.10');

-- Seed gallery_items
INSERT INTO public.gallery_items (alt, meta, sort_order) VALUES
('Music Video Shoot — Poppin', 'Studio, 2026', 1),
('Live Performance — Raw Set', 'Berlin, 2026', 2),
('Music Video — Long Kiss Goodnight', 'On Location, 2025', 3),
('Studio Session — Vocal Take', 'Studio, 2026', 4),
('Live — Freestyle Set', 'London, 2025', 5),
('Behind the Scenes — Visual Shoot', 'Tokyo, 2026', 6),
('Studio — Production Setup', 'Home Studio, 2026', 7),
('Backstage — Pre-Show', 'Milan, 2025', 8),
('Print — Press Photo', 'London, 2025', 9);

-- Seed music_links
INSERT INTO public.music_links (title, youtube_id, sort_order) VALUES
('Video I', '29vWUXMTkME', 1),
('Video II', 'OamCSPuswjg', 2),
('Video III', '4T6mFd2Sz_Y', 3),
('Video IV', 'l62mMBXck70', 4);

-- Seed merch_products
INSERT INTO public.merch_products (title, price, meta) VALUES
('Construct Tee — Black', 65, 'Cotton 220gsm'),
('Volume VII Hoodie', 120, 'French Terry 350gsm'),
('Scaffold Cap', 45, 'Washed Canvas'),
('Absence Longsleeve', 75, 'Cotton 200gsm'),
('Raw Print Tote', 35, 'Heavy Canvas'),
('Material Tension Poster', 25, '70x100cm Matte');

-- Seed contact_submissions
INSERT INTO public.contact_submissions (name, email, subject, message, read, created_at) VALUES
('Sarah K.', 'sarah@press.com', 'Press Inquiry', 'Would love to feature Chey in our next issue.', false, now() - interval '1 day'),
('DJ Amal', 'amal@booking.io', 'Booking Request', 'Interested in a live set for our Berlin event in April.', true, now() - interval '3 days'),
('Tom R.', 'tom@collab.net', 'Collaboration', 'Sent you some beats. Let me know if anything resonates.', true, now() - interval '9 days');
