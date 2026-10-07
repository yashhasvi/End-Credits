package com.endcredits.api.take;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "movie_takes")
public class MovieTake {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "tmdb_id", nullable = false) private Long tmdbId;
    @Column(nullable = false, length = 1200) private String body;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected MovieTake() { }
    public MovieTake(Long userId, Long tmdbId, String body) { this.userId = userId; this.tmdbId = tmdbId; update(body); }
    public void update(String body) { this.body = body; this.updatedAt = Instant.now(); }
    public Long getTmdbId() { return tmdbId; }
    public String getBody() { return body; }
    public Instant getUpdatedAt() { return updatedAt; }
}
