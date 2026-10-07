package com.endcredits.api.profile;

import java.util.List;

import com.endcredits.api.take.MovieTakeRepository;
import com.endcredits.api.collection.UserMovie;
import com.endcredits.api.collection.UserMovieRepository;
import com.endcredits.api.collection.MyFiveMovieRepository;
import com.endcredits.api.collection.WatchStatus;
import com.endcredits.api.user.User;
import com.endcredits.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * A deliberately small, anonymous-safe projection for public cinema profiles.
 * Account and security fields must never be added to this response.
 */
@RestController
@RequestMapping("/api/public/profiles")
public class PublicProfileController {

    private final UserRepository userRepository;
    private final UserMovieRepository userMovieRepository;
    private final MyFiveMovieRepository myFiveMovieRepository;
    private final MovieTakeRepository movieTakeRepository;

    public PublicProfileController(UserRepository userRepository, UserMovieRepository userMovieRepository,
            MyFiveMovieRepository myFiveMovieRepository, MovieTakeRepository movieTakeRepository) {
        this.userRepository = userRepository;
        this.userMovieRepository = userMovieRepository;
        this.myFiveMovieRepository = myFiveMovieRepository;
        this.movieTakeRepository = movieTakeRepository;
    }

    @GetMapping("/{username}")
    public PublicProfileResponse profile(@PathVariable String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cinema profile not found."));
        if (!user.isProfilePublic()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cinema profile not found.");
        }

        List<PublicProfileMovieResponse> movies = userMovieRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(PublicProfileMovieResponse::from)
                .toList();
        List<PublicProfileMovieResponse> myFive = myFiveMovieRepository.findByUserIdOrderByPositionAsc(user.getId())
                .stream()
                .flatMap(entry -> userMovieRepository.findByUserIdAndTmdbId(user.getId(), entry.getTmdbId()).stream())
                .map(PublicProfileMovieResponse::from)
                .toList();
        List<PublicProfileTakeResponse> takes = movieTakeRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .flatMap(take -> userMovieRepository.findByUserIdAndTmdbId(user.getId(), take.getTmdbId())
                        .map(movie -> PublicProfileTakeResponse.from(movie, take)).stream())
                .toList();

        return new PublicProfileResponse(user.getUsername(), movies, myFive, takes);
    }
}

record PublicProfileResponse(String username, List<PublicProfileMovieResponse> movies,
        List<PublicProfileMovieResponse> myFive, List<PublicProfileTakeResponse> takes) {
}

record PublicProfileTakeResponse(Long tmdbId, String movieTitle, String body, java.time.Instant updatedAt) {
    static PublicProfileTakeResponse from(UserMovie movie, com.endcredits.api.take.MovieTake take) {
        return new PublicProfileTakeResponse(take.getTmdbId(), movie.getTitle(), take.getBody(), take.getUpdatedAt());
    }
}

record PublicProfileMovieResponse(Long tmdbId, String title, String releaseDate, String posterPath, WatchStatus status,
        Integer rating) {
    static PublicProfileMovieResponse from(UserMovie movie) {
        return new PublicProfileMovieResponse(movie.getTmdbId(), movie.getTitle(), movie.getReleaseDate(),
                movie.getPosterPath(), movie.getStatus(), movie.getRating());
    }
}
