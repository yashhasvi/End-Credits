package com.endcredits.api.collection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class UserMovieRatingTest {

    @Test
    void acceptsAndClearsAOneToTenRating() {
        UserMovie movie = new UserMovie(1L, 157336L, "Interstellar", "2014-11-05", "/poster.jpg",
                WatchStatus.FINISHED);

        movie.updateRating(8);
        assertEquals(8, movie.getRating());

        movie.updateRating(null);
        assertNull(movie.getRating());
    }
}
