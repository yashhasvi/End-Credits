package com.endcredits.api.take;

import java.time.Instant;
import java.util.List;

import com.endcredits.api.auth.AuthenticatedUser;
import com.endcredits.api.collection.UserMovieRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/takes")
public class MovieTakeController {
    private final MovieTakeRepository movieTakeRepository;
    private final UserMovieRepository userMovieRepository;

    public MovieTakeController(MovieTakeRepository movieTakeRepository, UserMovieRepository userMovieRepository) {
        this.movieTakeRepository = movieTakeRepository;
        this.userMovieRepository = userMovieRepository;
    }

    @GetMapping
    public List<MovieTakeResponse> takes(@AuthenticationPrincipal AuthenticatedUser user) {
        return movieTakeRepository.findByUserIdOrderByUpdatedAtDesc(user.id()).stream().map(MovieTakeResponse::from).toList();
    }

    @PutMapping("/{tmdbId}")
    @Transactional
    public MovieTakeResponse save(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long tmdbId,
            @Valid @RequestBody SaveMovieTakeRequest request) {
        userMovieRepository.findByUserIdAndTmdbId(user.id(), tmdbId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "Write a Take for a saved film."));
        MovieTake take = movieTakeRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                .orElseGet(() -> new MovieTake(user.id(), tmdbId, request.body().trim()));
        take.update(request.body().trim());
        return MovieTakeResponse.from(movieTakeRepository.save(take));
    }

    @DeleteMapping("/{tmdbId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remove(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable @Positive Long tmdbId) {
        MovieTake take = movieTakeRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Take not found."));
        movieTakeRepository.delete(take);
    }
}

record SaveMovieTakeRequest(@NotBlank @Size(max = 1200) String body) { }
record MovieTakeResponse(Long tmdbId, String body, Instant updatedAt) {
    static MovieTakeResponse from(MovieTake take) { return new MovieTakeResponse(take.getTmdbId(), take.getBody(), take.getUpdatedAt()); }
}
