package com.endcredits.api.collection;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "watch_history")
public class WatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tmdb_id", nullable = false)
    private Long tmdbId;

    @Column(name = "watched_at", nullable = false, updatable = false)
    private Instant watchedAt;

    protected WatchEvent() {
    }

    public WatchEvent(Long userId, Long tmdbId) {
        this.userId = userId;
        this.tmdbId = tmdbId;
        this.watchedAt = Instant.now();
    }

    public Instant getWatchedAt() {
        return watchedAt;
    }
}
