"use strict";

// Mã TMDB hiện có: API và cấu hình đã được tách ra config.js/api.js.
// Giữ nguyên luồng trang chủ, chi tiết, watchlist và bình luận để học sinh phát triển tiếp.
const IMAGE_URL = TMDB_CONFIG.IMAGE_URL;

// ===== Login and watchlist =====

// Get all saved accounts from the browser. Gives an empty list if nobody has registered yet
function getUsers() {
  // Read the saved accounts (they are saved as text)
  const saved = localStorage.getItem("users");
  // Nothing is saved yet
  if (saved === null) {
    return [];
  }
  // Turn the saved text back into data and give it back
  return JSON.parse(saved);
}

// Find out who is logged in. Gives the name and email, or null if nobody is logged in
function getCurrentUser() {
  // Read the saved login, if there is one
  const saved = localStorage.getItem("session");
  // Nothing is saved yet
  if (saved === null) {
    return null;
  }

  // Turn the saved text back into data
  const session = JSON.parse(saved);

  // The login ran out of time: delete it
  if (Date.now() > session.expires) {
    // Delete the login
    localStorage.removeItem("session");
    return null;
  }

  // Get all the accounts
  const users = getUsers();
  // Make sure the account still exists
  let found = false;
  // Look at every account one by one
  for (let i = 0; i < users.length; i++) {
    // This is the account of the login
    if (users[i].email === session.email) {
      // The account exists
      found = true;
    }
  }

  // The account is gone: delete the login
  if (!found) {
    // Delete the login
    localStorage.removeItem("session");
    return null;
  }

  // Logged in: give back the name and email
  return { name: session.name, email: session.email };
}

// Get the saved movies of the logged in user. Gives an empty list if nobody is logged in
function getWatchlist() {
  // Find out who is logged in
  const user = getCurrentUser();
  // Nobody is logged in
  if (user === null) {
    return [];
  }
  // Every user has their own list, saved under their email
  const saved = localStorage.getItem("watchlist-" + user.email);
  // Nothing is saved yet
  if (saved === null) {
    return [];
  }
  // Turn the saved text back into data and give it back
  return JSON.parse(saved);
}

// Save the watchlist of the logged in user
function saveWatchlist(list) {
  // Find out who is logged in
  const user = getCurrentUser();
  // Save the list under this user's email
  localStorage.setItem("watchlist-" + user.email, JSON.stringify(list));
}

// Check if a movie is already in the watchlist
function isInWatchlist(movieId) {
  // Get the saved list
  const list = getWatchlist();
  // Go through every item in the list
  for (let i = 0; i < list.length; i++) {
    // This is the movie we are looking for
    if (list[i].id === movieId) {
      return true;
    }
  }
  return false;
}

// Add a movie to the watchlist
function addToWatchlist(movie) {
  // Get the saved list
  const list = getWatchlist();
  // Save only the details needed to show the movie card
  list.push({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average
  });
  // Save the changed list
  saveWatchlist(list);
}

// Remove a movie from the watchlist
function removeFromWatchlist(movieId) {
  // Get the saved list
  const list = getWatchlist();
  // Make a new list without the removed movie
  const newList = [];
  // Go through every item in the list
  for (let i = 0; i < list.length; i++) {
    // Keep every movie except the one we remove
    if (list[i].id !== movieId) {
      // Keep this item
      newList.push(list[i]);
    }
  }
  // Save the new list
  saveWatchlist(newList);
}

// ===== Navigation bar and banner =====

// Show Log in / Create account when logged out, or the user's name and Log out when logged in
function setupNav() {
  // Find the empty spot in the navigation bar
  const box = document.getElementById("auth-links");
  // Find out who is logged in
  const user = getCurrentUser();

  // Nobody is logged in
  if (user === null) {
    // Logged out: show the login and register links
    box.innerHTML = '<a href="login.html">Log in</a><a class="nav-button" href="register.html">Create account</a>';
    return;
  }

  // Logged in: show the name and a Log out link
  box.innerHTML = '<span class="user-name"></span><a href="#" id="logout-link">Log out</a>';
  box.querySelector(".user-name").textContent = "Hi, " + user.name;

  const logoutLink = document.getElementById("logout-link");
  // When Log out is clicked, delete the login and go to the home page
  logoutLink.addEventListener("click", function (event) {
    // Stop the browser from doing its normal action
    event.preventDefault();
    // Delete the login
    localStorage.removeItem("session");
    // Go to the home page
    window.location.href = "index.html";
  });
}

// Hide the "Join Reelhouse today" banner when the user is already logged in
function hideJoinBanner() {
  // Find the banner (only the home page has it)
  const banner = document.getElementById("join-banner");
  if (banner !== null && getCurrentUser() !== null) {
    // Hide the banner
    banner.classList.add("hidden");
  }
}

// ===== Small helpers that build pieces of the page =====

// Build the poster picture. Gives empty text if the movie has no poster
function makePoster(path) {
  // The movie has a picture, so build the image tag
  if (path) {
    return '<img src="' + IMAGE_URL + path + '" alt="">';
  }
  return "";
}

// Get the year from a date like 2026-05-01. Shows Unknown if there is no date
function makeYear(date) {
  // There is a date, so keep the first 4 characters (the year)
  if (date) {
    return date.slice(0, 4);
  }
  return "Unknown";
}

// Show the rating like 7.5 / 10
function makeRating(number) {
  // There is a rating, so show it with one decimal
  if (number) {
    return number.toFixed(1) + " / 10";
  }
  return "No rating";
}

// Change minutes into hours and minutes, like 2h 5m
function makeRuntime(minutes) {
  // The length is not known
  if (!minutes) {
    return "Unknown";
  }
  // Whole hours first, then the minutes that are left
  const hours = Math.floor(minutes / 60);
  // The minutes that are left after taking out the hours
  const left = minutes % 60;
  return hours + "h " + left + "m";
}

// Build the genre tags. limit is the most tags to show
function makeTags(genres, limit) {
  // Start with empty text and add pieces to it
  let html = "";
  // Make one tag for every genre, up to the limit
  for (let i = 0; i < genres.length && i < limit; i++) {
    html = html + '<span class="tag">' + genres[i].name + "</span>";
  }
  // Give back the finished HTML
  return html;
}

// Build one clickable movie card with poster, title, year and rating
function makeCard(movie) {
  // The whole card is a link to the movie details page
  let html = '<a class="movie-card" href="movie.html?id=' + movie.id + '">';
  // The poster part
  html = html + '<div class="poster">' + makePoster(movie.poster_path) + "</div>";
  // The text part
  html = html + '<div class="movie-info">';
  // The title
  html = html + "<h3>" + movie.title + "</h3>";
  // The year
  html = html + "<p>" + makeYear(movie.release_date) + "</p>";
  // The rating
  html = html + '<p class="rating">' + makeRating(movie.vote_average) + "</p>";
  // Close the text part
  html = html + "</div>";
  // Close the card link
  html = html + "</a>";
  // Give back the finished HTML
  return html;
}

// Put a list of movies into a box on the page. limit is the most movies to show
function showMovies(boxId, movies, limit) {
  // Find the box on the page
  const box = document.getElementById(boxId);

  // Nothing to show
  if (movies.length === 0) {
    // Show a message instead of cards
    box.innerHTML = "<p>No movies found.</p>";
    return;
  }

  // Start with empty text and add pieces to it
  let html = "";
  // Build one card for every movie
  for (let i = 0; i < movies.length && i < limit; i++) {
    // Add the card to the HTML
    html = html + makeCard(movies[i]);
  }
  // Put all the cards into the box
  box.innerHTML = html;
}

// Show an error message in a box when the movies could not be loaded
function showError(boxId) {
  // Find the box on the page
  const box = document.getElementById(boxId);
  // Show the error message
  box.innerHTML = "<p>Could not load movies. Please check your internet and your API key.</p>";
}

// ===== Home page sections =====

// Load the movies that are in cinemas now
async function loadNowShowing() {
  // Try to load the data
  try {
    // Ask TMDB for the movies in cinemas now
    const data = await getData("/movie/now_playing");
    // Show the first 8
    showMovies("now-showing-grid", data.results, 8);
  } catch (error) {
    // If something goes wrong (for example no internet), show a message instead of crashing
    showError("now-showing-grid");
  }
}

// Load the trending movie of the week into the big featured section
async function loadFeatured() {
  // Try to load the data
  try {
    // Ask TMDB for the trending movies of the week
    const trending = await getData("/trending/movie/week");
    // Take the first movie of the trending list
    const first = trending.results[0];
    // Ask again for the full details (genres and length)
    const movie = await getData("/movie/" + first.id);

    // Use a backup text if the movie has no description
    let description = movie.overview;
    if (!description) {
      description = "No description available.";
    }

    // Fill the featured section with the movie details
    document.getElementById("featured-poster").innerHTML = makePoster(movie.poster_path);
    // The title
    document.getElementById("featured-title").textContent = movie.title;
    // The genre tags and the length
    document.getElementById("featured-tags").innerHTML = makeTags(movie.genres, 3) + '<span class="tag">' + makeRuntime(movie.runtime) + "</span>";
    // The description
    document.getElementById("featured-description").textContent = description;
    // The rating
    document.getElementById("featured-rating").textContent = "Rating: " + makeRating(movie.vote_average);
    // Make the button open this movie's details page
    document.getElementById("featured-link").href = "movie.html?id=" + movie.id;
  } catch (error) {
    // If something goes wrong (for example no internet), show a message instead of crashing
    document.getElementById("featured-description").textContent = "Could not load the trending movie.";
  }
}

// Load the highest rated movies
async function loadTopRated() {
  // Try to load the data
  try {
    // Ask TMDB for the top rated movies
    const data = await getData("/movie/top_rated");
    // Show the first 4
    showMovies("top-rated-grid", data.results, 4);
  } catch (error) {
    // If something goes wrong (for example no internet), show a message instead of crashing
    showError("top-rated-grid");
  }
}

// Load the movies that come out soon
async function loadUpcoming() {
  // Try to load the data
  try {
    // Ask TMDB for the movies that come out soon
    const data = await getData("/movie/upcoming");
    // Show the first 4
    showMovies("upcoming-grid", data.results, 4);
  } catch (error) {
    // If something goes wrong (for example no internet), show a message instead of crashing
    showError("upcoming-grid");
  }
}

// ===== Search and genres =====

// Show search or genre results in the results section at the top of the page
async function showResults(title, path, extra) {
  // Find the results section and its grid
  const section = document.getElementById("results-section");
  const grid = document.getElementById("results-grid");

  // Show the results section (it is hidden at first)
  section.classList.remove("hidden");
  // Set the heading of the results
  document.getElementById("results-title").textContent = title;
  // Show Loading... while we wait for TMDB
  grid.innerHTML = "<p>Loading...</p>";
  // Scroll down to the results
  section.scrollIntoView();

  // Try to load the data
  try {
    // Ask TMDB and show up to 12 movies
    const data = await getData(path, extra);
    showMovies("results-grid", data.results, 12);
  } catch (error) {
    // If something goes wrong (for example no internet), show a message instead of crashing
    // Show an error message
    grid.innerHTML = "<p>Could not load the results.</p>";
  }
}

// Load the list of genres and make one button for each genre
async function loadGenres() {
  // Find the genre area
  const box = document.getElementById("genre-list");

  // Try to load the data
  try {
    // Ask TMDB for the list of genres
    const data = await getData("/genre/movie/list");
    // Remove the old content
    box.innerHTML = "";

    // Go through every genre
    for (let i = 0; i < data.genres.length; i++) {
      // The genre we are working on
      const genre = data.genres[i];
      // Make a button for this genre
      const button = document.createElement("button");
      // Make sure the button does not send a form
      button.type = "button";
      // Show the genre name on the button
      button.textContent = genre.name;
      // When the button is clicked, show the movies of this genre
      button.addEventListener("click", function () {
        // Show the most popular movies of this genre
        showResults("Genre: " + genre.name, "/discover/movie", "&sort_by=popularity.desc&with_genres=" + genre.id);
      });
      // Put the button on the page
      box.appendChild(button);
    }
  } catch (error) {
    // If something goes wrong (for example no internet), show a message instead of crashing
    // Show an error message
    box.innerHTML = "<p>Could not load the genres.</p>";
  }
}

// Make the search box and the search button work
function setupSearch() {
  // Find the search box and the search button
  const input = document.getElementById("search-input");
  const button = document.getElementById("search-button");

  // Read the search text and show the results. Does nothing if the box is empty
  function runSearch() {
    // Read the text and remove extra spaces
    const text = input.value.trim();
    // Nothing was typed, so do nothing
    if (text === "") {
      return;
    }
    // Show the results. encodeURIComponent makes the text safe to use in a web address
    showResults('Results for "' + text + '"', "/search/movie", "&query=" + encodeURIComponent(text));
  }

  // Search when the button is clicked
  button.addEventListener("click", runSearch);

  // Also search when the Enter key is pressed
  input.addEventListener("keydown", function (event) {
    // Was it the Enter key?
    if (event.key === "Enter") {
      // Search
      runSearch();
    }
  });
}

// ===== Watchlist =====

// Show the saved movies on the home page. Does nothing if the list is empty
function showWatchlist() {
  // Get the saved list
  const list = getWatchlist();
  // There is nothing to show
  if (list.length === 0) {
    return;
  }
  // Show the watchlist section (it is hidden at first)
  document.getElementById("watchlist-section").classList.remove("hidden");
  // Show up to 12 saved movies
  showMovies("watchlist-grid", list, 12);
}

// Change the text of the watchlist button: log in, remove or add
function updateWatchlistButton(button, movie) {
  // Nobody is logged in
  if (getCurrentUser() === null) {
    // Logged out: ask the user to log in
    button.textContent = "Log in to add to watchlist";
  // The movie is already saved, so offer to remove it
  } else if (isInWatchlist(movie.id)) {
    button.textContent = "Remove from watchlist";
  } else {
    // The movie is not saved yet, so offer to add it
    button.textContent = "Add to watchlist";
  }
}

// Make the watchlist button on the movie page work
function setupWatchlistButton(movie) {
  // Find the watchlist button
  const button = document.getElementById("watchlist-button");
  // Set the text of the button now
  updateWatchlistButton(button, movie);

  // When the button is clicked: not logged in goes to the login page
  button.addEventListener("click", function () {
    // Nobody is logged in
    if (getCurrentUser() === null) {
      // Go to the login page
      window.location.href = "login.html";
      return;
    }

    // Already saved: remove it. Not saved yet: add it
    if (isInWatchlist(movie.id)) {
      // Remove the movie
      removeFromWatchlist(movie.id);
    } else {
      // Add the movie
      addToWatchlist(movie);
    }

    // Change the text of the button after the click
    updateWatchlistButton(button, movie);
  });
}

// ===== Movie details page =====

// Build the boxes with the first 8 actors and the roles they play
function makeCastList(credits) {
  // There is no cast information
  if (!credits.cast || credits.cast.length === 0) {
    return "<p>No cast information.</p>";
  }

  // Start with empty text and add pieces to it
  let html = "";
  // Go through the first 8 actors
  for (let i = 0; i < credits.cast.length && i < 8; i++) {
    // The actor we are working on
    const person = credits.cast[i];
    // The role the actor plays. Use empty text if it is missing
    let role = person.character;
    if (!role) {
      role = "";
    }
    // Add a box for this actor
    html = html + '<div class="cast-item"><strong>' + person.name + "</strong><p>" + role + "</p></div>";
  }
  // Give back the finished HTML
  return html;
}

// Load one movie and show all its details
async function loadMovie() {
  // Find the box for the movie details
  const box = document.getElementById("movie-details");
  // Get the movie number from the page address (for example movie.html?id=123)
  const id = new URLSearchParams(window.location.search).get("id");

  // Stop if there is no valid movie number
  if (!id || isNaN(Number(id))) {
    // Tell the user
    box.innerHTML = "<p>No movie was selected.</p>";
    return;
  }

  // Try to load the data
  try {
    // Ask TMDB for the movie details and the cast
    const movie = await getData("/movie/" + id, "&append_to_response=credits");
    // Show the movie name in the browser tab
    document.title = movie.title + " - Reelhouse";

    // Some information can be missing, so use a backup text for it
    let tagline = "";
    // Only show the tagline if the movie has one
    if (movie.tagline) {
      tagline = '<p class="tagline">' + movie.tagline + "</p>";
    }

    // Use a backup text if there is no description
    let overview = movie.overview;
    if (!overview) {
      overview = "No description available.";
    }

    // Use a backup text if there is no release date
    let releaseDate = movie.release_date;
    if (!releaseDate) {
      releaseDate = "Unknown";
    }

    // Build the details block piece by piece: poster, text, facts, button and cast
    let html = '<div class="details">';
    // The poster
    html = html + '<div class="poster">' + makePoster(movie.poster_path) + "</div>";
    // The text next to the poster
    html = html + '<div class="details-text">';
    // The movie title
    html = html + "<h1>" + movie.title + "</h1>";
    // The tagline
    html = html + tagline;
    // The genre tags
    html = html + makeTags(movie.genres, 10);
    // The description
    html = html + "<p>" + overview + "</p>";
    // The facts: release date, length, status and rating
    html = html + '<div class="facts">';
    html = html + "<p><strong>Release date:</strong> " + releaseDate + "</p>";
    html = html + "<p><strong>Runtime:</strong> " + makeRuntime(movie.runtime) + "</p>";
    html = html + "<p><strong>Status:</strong> " + movie.status + "</p>";
    html = html + '<p class="rating">Rating: ' + makeRating(movie.vote_average) + " (" + movie.vote_count + " votes)</p>";
    html = html + "</div>";
    // The watchlist button. Its text is set by setupWatchlistButton
    html = html + '<button class="button" id="watchlist-button" type="button"></button>';
    html = html + "</div>";
    html = html + "</div>";
    // The cast
    html = html + '<h2 class="cast-title">Cast</h2>';
    html = html + '<div class="cast-list">' + makeCastList(movie.credits) + "</div>";

    // Put the finished block on the page
    box.innerHTML = html;
    // Turn on the watchlist button
    setupWatchlistButton(movie);
    // Show the comments for this movie
    startComments(movie.id);
  } catch (error) {
    // If something goes wrong (for example no internet), show a message instead of crashing
    // Show an error message
    box.innerHTML = "<p>Could not load this movie. Please check your internet and your API key.</p>";
  }
}

// ===== Comments =====

// Get the saved comments of one movie. Gives an empty list if there are none
function getComments(movieId) {
  // Comments are saved separately for every movie, using the movie number
  const saved = localStorage.getItem("comments-" + movieId);
  // Nothing is saved yet
  if (saved === null) {
    return [];
  }
  // Turn the saved text back into data and give it back
  return JSON.parse(saved);
}

// Save the comments of one movie
function saveComments(movieId, list) {
  // Save the comments of this movie
  localStorage.setItem("comments-" + movieId, JSON.stringify(list));
}

// Make the address of the round avatar picture (made from the user's name by DiceBear)
function makeAvatarUrl(name) {
  // DiceBear makes a picture with the user's initials
  return "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(name);
}

// Make an image element for an avatar
function makeAvatarElement(name) {
  const avatar = document.createElement("img");
  // Style it as a round avatar
  avatar.className = "avatar";
  avatar.alt = "";
  // Load the picture
  avatar.src = makeAvatarUrl(name);
  return avatar;
}

// Show the comment box. Logged out users see "Sign in to comment", logged in users can write
function showCommentForm(movieId) {
  // Find the place where the form goes
  const container = document.getElementById("comment-box-container");
  // Find out who is logged in
  const user = getCurrentUser();

  // Start with the logged out version of the form
  let avatarHtml = '<span class="avatar avatar-guest">?</span>';
  // These are the settings for a logged out user: the text box cannot be clicked (the form handles the click) and the send button is hidden
  let formClass = "comment-form guest-form";
  let inputExtra = ' style="pointer-events: none"';
  let buttonExtra = ' style="display: none"';

  // Logged in: use the user's avatar and turn on the text box and send button
  if (user !== null) {
    // Logged in: use a real avatar picture
    avatarHtml = '<img class="avatar" id="comment-avatar" alt="">';
    formClass = "comment-form";
    inputExtra = "";
    buttonExtra = "";
  }

  // Build the comment form
  let html = '<form id="comment-form" class="' + formClass + '" autocomplete="off">';
  // The avatar
  html = html + avatarHtml;
  // The text box. Comments can be up to 500 characters
  html = html + '<input required type="text" id="comment" name="comment" maxlength="500"' + inputExtra + ">";
  // The send button
  html = html + '<button type="submit" aria-label="Send comment"' + buttonExtra + ">";
  // The paper plane drawing inside the button
  html = html + '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M2 21l21-9L2 3v7l15 2-15 2z"></path></svg>';
  html = html + "</button>";
  html = html + "</form>";
  // Put the form on the page
  container.innerHTML = html;

  // Find the form and the text box
  const form = document.getElementById("comment-form");
  // Find the text box
  const input = document.getElementById("comment");

  // Nobody is logged in
  if (user === null) {
    // Logged out: clicking anywhere on the form goes to the login page
    input.placeholder = "Sign in to comment";
    // Clicking anywhere on the form goes to the login page
    form.addEventListener("click", function () {
      // Go to the login page
      window.location.href = "login.html";
    });
    return;
  }

  // Logged in: show the user's name and avatar
  input.placeholder = "Comment as " + user.name;
  // Load the avatar picture for this user
  document.getElementById("comment-avatar").src = makeAvatarUrl(user.name);

  // When the form is sent, add the new comment
  form.addEventListener("submit", function (event) {
    // Stop the browser from doing its normal action
    event.preventDefault();

    // Read the comment and remove extra spaces
    const text = input.value.trim();
    // The comment is empty, so do nothing
    if (text === "") {
      return;
    }

    // Get the saved comments of this movie
    const list = getComments(movieId);
    // Add the new comment to the list
    list.push({
      // A number that is different for every comment: the current time
      id: Date.now(),
      name: user.name,
      email: user.email,
      text: text,
      time: Date.now()
    });
    // Save the comments
    saveComments(movieId, list);

    // Empty the text box
    input.value = "";
    // Show the list of comments
    showCommentList(movieId);
  });
}

// Delete one comment and show the list again
function deleteComment(movieId, commentId) {
  // Get the saved comments of this movie
  const list = getComments(movieId);
  // Make a new list without the deleted comment
  const newList = [];
  // Go through every item in the list
  for (let i = 0; i < list.length; i++) {
    // Keep every comment except the deleted one
    if (list[i].id !== commentId) {
      // Keep this item
      newList.push(list[i]);
    }
  }
  // Save the list without the deleted comment
  saveComments(movieId, newList);
  // Show the list of comments
  showCommentList(movieId);
}

// Build the box for one comment: avatar, name, time, text and maybe a Delete button
function makeCommentElement(movieId, comment, user) {
  // The outer box of one comment
  const item = document.createElement("div");
  // Style the outer box
  item.className = "comment-item";

  // The box that holds the text part
  const body = document.createElement("div");
  // Style the text box
  body.className = "comment-body";

  // The name of the writer in bold
  const name = document.createElement("strong");
  // textContent shows the text safely, so nobody can put HTML into the page
  name.textContent = comment.name;

  // The date and time in small text
  const time = document.createElement("small");
  // Show the date and time of the comment
  time.textContent = " " + new Date(comment.time).toLocaleString();

  // The comment text
  const text = document.createElement("p");
  // Show the comment safely as plain text
  text.textContent = comment.text;

  // Put the name, time and text into the text box
  body.appendChild(name);
  body.appendChild(time);
  body.appendChild(text);

  // Only the person who wrote the comment gets a Delete button
  if (user !== null && user.email === comment.email) {
    // Make the Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "comment-delete";
    deleteButton.textContent = "Delete";
    // Delete the comment when the button is clicked
    deleteButton.addEventListener("click", function () {
      deleteComment(movieId, comment.id);
    });
    body.appendChild(deleteButton);
  }

  // Put the avatar and the text together
  item.appendChild(makeAvatarElement(comment.name));
  item.appendChild(body);
  // Give back the finished comment
  return item;
}

// Show all comments of the movie, newest first
function showCommentList(movieId) {
  // Find the place for the list
  const box = document.getElementById("comment-list");
  // Find the heading
  const title = document.getElementById("comments-title");
  // Get the saved comments of this movie
  const list = getComments(movieId);
  // Find out who is logged in
  const user = getCurrentUser();

  // Show how many comments there are
  title.textContent = "Comments (" + list.length + ")";
  // Remove the old content
  box.innerHTML = "";

  // There is nothing to show
  if (list.length === 0) {
    // Nobody has commented yet
    box.innerHTML = "<p>No comments yet. Be the first to comment.</p>";
    return;
  }

  // Go from the last comment to the first so the newest shows at the top
  for (let i = list.length - 1; i >= 0; i--) {
    // Add this comment to the list
    box.appendChild(makeCommentElement(movieId, list[i], user));
  }
}

// Show the comments section with the form and the list
function startComments(movieId) {
  // Show the comments section (it is hidden at first)
  document.getElementById("comments-section").classList.remove("hidden");
  // Build the comment form
  showCommentForm(movieId);
  // Show the list of comments
  showCommentList(movieId);
}

// ===== Starting the page =====

// Start everything on the home page
function startHomePage() {
  // Make the search work
  setupSearch();
  // Show the saved movies
  showWatchlist();
  // Load the movies in cinemas now
  loadNowShowing();
  // Load the trending movie
  loadFeatured();
  // Load the top rated movies
  loadTopRated();
  // Load the genre buttons
  loadGenres();
  // Load the movies that come out soon
  loadUpcoming();
}

// Runs on every page: fill the navigation bar and hide the join banner for logged in users
setupNav();
// Hide the join banner if the user is logged in
hideJoinBanner();

// This box only exists on the home page, so start the home page here
if (document.getElementById("now-showing-grid") !== null) {
  // Start the home page
  startHomePage();
}

// This box only exists on the movie page, so load the movie here
if (document.getElementById("movie-details") !== null) {
  // Load the movie
  loadMovie();
}
