package com.endcredits.api.profile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;

import com.endcredits.api.collection.UserMovie;
import com.endcredits.api.collection.UserMovieRepository;
import com.endcredits.api.collection.MyFiveMovieRepository;
import com.endcredits.api.collection.MyFiveMovie;
import com.endcredits.api.take.MovieTakeRepository;
import com.endcredits.api.take.MovieTake;
import com.endcredits.api.collection.WatchStatus;
import com.endcredits.api.user.User;
import com.endcredits.api.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class PublicProfileControllerTest {

    @Test
    void returnsOnlyThePublicCinemaProjection() throws Exception {
        User user = userWithId(42L, "yashasvi", "private@example.test");
        user.updateProfilePublic(true);
        UserMovie movie = new UserMovie(42L, 157336L, "Interstellar", "2014-11-05", "/poster.jpg",
                WatchStatus.FINISHED);
        MyFiveMovie myFiveMovie = new MyFiveMovie(42L, 157336L, (short) 1);
        MovieTake take = new MovieTake(42L, 157336L, "The clock never stopped ticking.");
        PublicProfileController controller = new PublicProfileController(
                repository(UserRepository.class, (method, args) -> Optional.of(user)),
                repository(UserMovieRepository.class, (method, args) -> method.equals("findByUserIdOrderByCreatedAtDesc")
                        ? List.of(movie) : Optional.of(movie)),
                repository(MyFiveMovieRepository.class, (method, args) -> List.of(myFiveMovie)),
                repository(MovieTakeRepository.class, (method, args) -> List.of(take)));

        PublicProfileResponse response = controller.profile("YASHASVI");

        assertEquals("yashasvi", response.username());
        assertEquals(1, response.movies().size());
        PublicProfileMovieResponse publicMovie = response.movies().getFirst();
        assertEquals(157336L, publicMovie.tmdbId());
        assertEquals("Interstellar", publicMovie.title());
        assertEquals("2014-11-05", publicMovie.releaseDate());
        assertEquals("/poster.jpg", publicMovie.posterPath());
        assertEquals(WatchStatus.FINISHED, publicMovie.status());
        assertEquals(List.of(publicMovie), response.myFive());
        assertEquals(1, response.takes().size());
        assertEquals("Interstellar", response.takes().getFirst().movieTitle());
        assertEquals("The clock never stopped ticking.", response.takes().getFirst().body());
    }

    @Test
    void reportsNotFoundWithoutLeakingWhetherOtherAccountFieldsExist() {
        PublicProfileController controller = new PublicProfileController(
                repository(UserRepository.class, (method, args) -> Optional.empty()),
                repository(UserMovieRepository.class, (method, args) -> List.of()),
                repository(MyFiveMovieRepository.class, (method, args) -> List.of()),
                repository(MovieTakeRepository.class, (method, args) -> List.of()));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.profile("missing-profile"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test
    void hidesAnOptedOutProfileAsNotFound() throws Exception {
        User user = userWithId(42L, "private-cinema", "private@example.test");
        PublicProfileController controller = new PublicProfileController(
                repository(UserRepository.class, (method, args) -> Optional.of(user)),
                repository(UserMovieRepository.class, (method, args) -> List.of()),
                repository(MyFiveMovieRepository.class, (method, args) -> List.of()),
                repository(MovieTakeRepository.class, (method, args) -> List.of()));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.profile("private-cinema"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    private static User userWithId(Long id, String username, String email) throws Exception {
        User user = new User(username, email, "{noop}not-returned");
        Field idField = User.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(user, id);
        return user;
    }

    @SuppressWarnings("unchecked")
    private static <T> T repository(Class<T> type, RepositoryAnswer answer) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] { type }, (proxy, method, args) ->
                answer.answer(method.getName(), args));
    }

    @FunctionalInterface
    private interface RepositoryAnswer {
        Object answer(String methodName, Object[] arguments) throws Throwable;
    }
}
