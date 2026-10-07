ALTER TABLE user_movies
    ADD COLUMN rating SMALLINT;

ALTER TABLE user_movies
    ADD CONSTRAINT ck_user_movies_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 10);
