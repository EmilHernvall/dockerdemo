CREATE TABLE catpicture (
    catpicture_id SERIAL NOT NULL,
    catpicture_redditid TEXT NOT NULL,
    catpicture_title TEXT NOT NULL,
    catpicture_user TEXT NOT NULL,
    catpicture_data BYTEA,
    catpicture_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_redditid ON catpicture (catpicture_redditid);
