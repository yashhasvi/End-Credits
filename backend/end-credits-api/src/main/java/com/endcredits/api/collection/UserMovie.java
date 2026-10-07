package com.endcredits.api.collection;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_movies")
public class UserMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tmdb_id", nullable = false)
    private Long tmdbId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "release_date", length = 10)
    private String releaseDate;

    @Column(name = "poster_path", length = 255)
    private String posterPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WatchStatus status;

    @Column(name = "rating")
    private Short rating;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserMovie() {
    }

    public UserMovie(Long userId, Long tmdbId, String title, String releaseDate, String posterPath, WatchStatus status) {
        this.userId = userId;
        this.tmdbId = tmdbId;
        this.title = title;
        this.releaseDate = releaseDate;
        this.posterPath = posterPath;
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public void update(String title, String releaseDate, String posterPath, WatchStatus status) {
        this.title = title;
        this.releaseDate = releaseDate;
        this.posterPath = posterPath;
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Long getTmdbId() { return tmdbId; }
    public String getTitle() { return title; }
    public String getReleaseDate() { return releaseDate; }
    public String getPosterPath() { return posterPath; }
    public WatchStatus getStatus() { return status; }
    public Integer getRating() { return rating == null ? null : rating.intValue(); }
    public void updateRating(Integer rating) { this.rating = rating == null ? null : rating.shortValue(); this.updatedAt = Instant.now(); }
}
