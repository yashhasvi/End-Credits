package com.endcredits.api.collection;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "my_five_movies")
public class MyFiveMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tmdb_id", nullable = false)
    private Long tmdbId;

    @Column(name = "slot", nullable = false)
    private short position;

    protected MyFiveMovie() {
    }

    public MyFiveMovie(Long userId, Long tmdbId, short position) {
        this.userId = userId;
        this.tmdbId = tmdbId;
        this.position = position;
    }

    public Long getTmdbId() { return tmdbId; }
    public short getPosition() { return position; }
}
