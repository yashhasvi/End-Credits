package com.endcredits.api.collection;

import java.util.List;

import com.endcredits.api.auth.AuthenticatedUser;
import com.endcredits.api.take.MovieTakeRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/collection")
public class CollectionController {

    private final UserMovieRepository userMovieRepository;
    private final WatchEventRepository watchEventRepository;
    private final MyFiveMovieRepository myFiveMovieRepository;
    private final MovieTakeRepository movieTakeRepository;

    public CollectionController(UserMovieRepository userMovieRepository, WatchEventRepository watchEventRepository,
            MyFiveMovieRepository myFiveMovieRepository, MovieTakeRepository movieTakeRepository) {
        this.userMovieRepository = userMovieRepository;
        this.watchEventRepository = watchEventRepository;
        this.myFiveMovieRepository = myFiveMovieRepository;
        this.movieTakeRepository = movieTakeRepository;
    }

    @GetMapping
    public List<CollectionMovieResponse> collection(@AuthenticationPrincipal AuthenticatedUser user) {
        return userMovieRepository.findByUserIdOrderByCreatedAtDesc(user.id()).stream()
                .map(movie -> CollectionMovieResponse.from(movie,
                        watchEventRepository.countByUserIdAndTmdbId(user.id(), movie.getTmdbId())))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CollectionMovieResponse save(@AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody SaveMovieRequest request) {
        UserMovie userMovie = userMovieRepository.findByUserIdAndTmdbId(user.id(), request.tmdbId()).orElse(null);
        boolean becameWatched = request.status() == WatchStatus.FINISHED
                && (userMovie == null || userMovie.getStatus() != WatchStatus.FINISHED);
        if (userMovie == null) {
            userMovie = new UserMovie(user.id(), request.tmdbId(), request.title().trim(), request.releaseDate(),
                    request.posterPath(), request.status());
        }

        userMovie.update(request.title().trim(), request.releaseDate(), request.posterPath(), request.status());
        UserMovie savedMovie = userMovieRepository.save(userMovie);
        if (becameWatched) {
            watchEventRepository.save(new WatchEvent(user.id(), savedMovie.getTmdbId()));
        }
        return CollectionMovieResponse.from(savedMovie,
                watchEventRepository.countByUserIdAndTmdbId(user.id(), savedMovie.getTmdbId()));
    }

    @PostMapping("/{tmdbId}/status")
    @Transactional
    public CollectionMovieResponse updateStatus(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive Long tmdbId, @Valid @RequestBody UpdateMovieStatusRequest request) {
        UserMovie userMovie = userMovieRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                .orElseThrow(() -> new CollectionMovieNotFoundException(tmdbId));
        boolean becameWatched = request.status() == WatchStatus.FINISHED && userMovie.getStatus() != WatchStatus.FINISHED;
        userMovie.update(userMovie.getTitle(), userMovie.getReleaseDate(), userMovie.getPosterPath(), request.status());
        UserMovie savedMovie = userMovieRepository.save(userMovie);
        if (becameWatched) {
            watchEventRepository.save(new WatchEvent(user.id(), savedMovie.getTmdbId()));
        }
        return CollectionMovieResponse.from(savedMovie,
                watchEventRepository.countByUserIdAndTmdbId(user.id(), savedMovie.getTmdbId()));
    }

    @PutMapping("/{tmdbId}/rating")
    @Transactional
    public CollectionMovieResponse updateRating(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive Long tmdbId, @Valid @RequestBody UpdateMovieRatingRequest request) {
        UserMovie userMovie = userMovieRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                .orElseThrow(() -> new CollectionMovieNotFoundException(tmdbId));
        userMovie.updateRating(request.rating());
        UserMovie savedMovie = userMovieRepository.save(userMovie);
        return CollectionMovieResponse.from(savedMovie,
                watchEventRepository.countByUserIdAndTmdbId(user.id(), savedMovie.getTmdbId()));
    }

    @DeleteMapping("/{tmdbId}/rating")
    @Transactional
    public CollectionMovieResponse clearRating(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive Long tmdbId) {
        UserMovie userMovie = userMovieRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                .orElseThrow(() -> new CollectionMovieNotFoundException(tmdbId));
        userMovie.updateRating(null);
        UserMovie savedMovie = userMovieRepository.save(userMovie);
        return CollectionMovieResponse.from(savedMovie,
                watchEventRepository.countByUserIdAndTmdbId(user.id(), savedMovie.getTmdbId()));
    }

    @DeleteMapping("/{tmdbId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remove(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable @Positive Long tmdbId) {
        UserMovie userMovie = userMovieRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                .orElseThrow(() -> new CollectionMovieNotFoundException(tmdbId));
        myFiveMovieRepository.deleteByUserIdAndTmdbId(user.id(), tmdbId);
        movieTakeRepository.deleteByUserIdAndTmdbId(user.id(), tmdbId);
        watchEventRepository.deleteByUserIdAndTmdbId(user.id(), tmdbId);
        userMovieRepository.delete(userMovie);
    }

    @PostMapping("/{tmdbId}/watch-events")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public WatchEventResponse logRewatch(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive Long tmdbId) {
        UserMovie userMovie = userMovieRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                .orElseThrow(() -> new CollectionMovieNotFoundException(tmdbId));
        if (userMovie.getStatus() != WatchStatus.FINISHED) {
            userMovie.update(userMovie.getTitle(), userMovie.getReleaseDate(), userMovie.getPosterPath(), WatchStatus.FINISHED);
            userMovieRepository.save(userMovie);
        }
        WatchEvent event = watchEventRepository.save(new WatchEvent(user.id(), tmdbId));
        return new WatchEventResponse(tmdbId, event.getWatchedAt(),
                watchEventRepository.countByUserIdAndTmdbId(user.id(), tmdbId));
    }
}

record SaveMovieRequest(
        @NotNull @Positive Long tmdbId,
        @NotBlank @Size(max = 255) String title,
        @Size(max = 10) String releaseDate,
        @Size(max = 255) String posterPath,
        @NotNull WatchStatus status) {
}

record UpdateMovieStatusRequest(@NotNull WatchStatus status) {
}

record UpdateMovieRatingRequest(@NotNull @Min(1) @Max(10) Integer rating) {
}

record CollectionMovieResponse(Long tmdbId, String title, String releaseDate, String posterPath, WatchStatus status,
        Integer rating, long watchCount) {
    static CollectionMovieResponse from(UserMovie movie, long watchCount) {
        return new CollectionMovieResponse(movie.getTmdbId(), movie.getTitle(), movie.getReleaseDate(),
                movie.getPosterPath(), movie.getStatus(), movie.getRating(), watchCount);
    }
}

record WatchEventResponse(Long tmdbId, java.time.Instant watchedAt, long watchCount) {
}

class CollectionMovieNotFoundException extends RuntimeException {
    CollectionMovieNotFoundException(Long tmdbId) {
        super("Movie " + tmdbId + " is not in your collection.");
    }
}
