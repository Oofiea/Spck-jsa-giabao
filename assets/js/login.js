// ===== Login page script =====

// Settings: how many wrong tries are allowed, how long the lock lasts (seconds), and how many hours a login stays active
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;
const SESSION_HOURS = 2;

// Find the form, the button and the message box on the page
const loginForm = document.getElementById("login-form");
const loginButton = loginForm.querySelector("button");
const messageBox = document.getElementById("message");

// Show a message to the user. type is "error" (red) or "success" (green)
function showMessage(text, type) {
  // Put the text into the message box
  messageBox.textContent = text;
  // Set the colour: red for an error, green for success
  messageBox.className = "message " + type;
}

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

// Look for one account by email. Gives the account, or null if there is none
function findUser(email) {
  // Get all the accounts
  const users = getUsers();
  // Look at every account one by one
  for (let i = 0; i < users.length; i++) {
    // Same email: this is the account we are looking for
    if (users[i].email === email) {
      return users[i];
    }
  }
  return null;
}

// Check if there is a saved login that has not run out of time
function alreadyLoggedIn() {
  const saved = localStorage.getItem("session");
  // Nothing is saved yet
  if (saved === null) {
    return false;
  }
  // Turn the saved text back into data
  const session = JSON.parse(saved);
  // The time has run out, so the user is not logged in
  if (Date.now() > session.expires) {
    return false;
  }
  return true;
}

// Make a random text code that is saved with the login
function makeToken() {
  // The characters a token can be made of
  const letters = "abcdefghijklmnopqrstuvwxyz0123456789";
  // Make room for 24 random numbers
  const bytes = new Uint8Array(24);
  // Fill them with random numbers from the browser
  crypto.getRandomValues(bytes);
  // The token starts empty and grows one character at a time
  let token = "";
  // Turn each random number into one character
  for (let i = 0; i < bytes.length; i++) {
    // Use the random number to pick a character
    token = token + letters[bytes[i] % letters.length];
  }
  // Give back the finished token
  return token;
}

// Scramble a password with a salt (SHA-256) so the real password is never saved
async function hashPassword(password, salt) {
  // Put the salt in front of the password
  const text = salt + password;
  // Change the text into bytes
  const data = new TextEncoder().encode(text);
  // Scramble the bytes with SHA-256
  const buffer = await crypto.subtle.digest("SHA-256", data);
  // Read the scrambled result as a list of bytes
  const bytes = new Uint8Array(buffer);
  // Change every byte into two letters or numbers (hex) and join them together
  let result = "";
  // Go through every byte
  for (let i = 0; i < bytes.length; i++) {
    // Write the byte in hex (base 16)
    let part = bytes[i].toString(16);
    // Add a 0 in front so every byte uses exactly two characters
    if (part.length === 1) {
      part = "0" + part;
    }
    // Add the two characters to the result
    result = result + part;
  }
  // Give back the scrambled password
  return result;
}

// Get the wrong-password counter for an email
function getAttempts(email) {
  const saved = localStorage.getItem("attempts-" + email);
  // Nothing is saved yet
  if (saved === null) {
    return { count: 0, lockedUntil: 0 };
  }
  // Turn the saved text back into data and give it back
  return JSON.parse(saved);
}

// Save the wrong-password counter
function saveAttempts(email, attempts) {
  localStorage.setItem("attempts-" + email, JSON.stringify(attempts));
}

// Delete the counter after a correct login
function clearAttempts(email) {
  localStorage.removeItem("attempts-" + email);
}

// Save the login in the browser so the user stays logged in
function startSession(user) {
  // The information saved about this login
  const session = {
    name: user.username,
    email: user.email,
    token: makeToken(),
    expires: Date.now() + SESSION_HOURS * 60 * 60 * 1000
  };
  // Save it in the browser
  localStorage.setItem("session", JSON.stringify(session));
}

// Check if the account is locked right now
function isLocked(attempts) {
  // The lock time has not ended yet
  if (Date.now() < attempts.lockedUntil) {
    return true;
  }
  return false;
}

// Count how many seconds are left until the lock ends
function secondsLeft(attempts) {
  // How much lock time is left, in milliseconds
  const milliseconds = attempts.lockedUntil - Date.now();
  // Change it to whole seconds, rounded up
  return Math.ceil(milliseconds / 1000);
}

// Called after a wrong email or password. Counts the try and locks the account after too many
function handleWrongPassword(email, attempts) {
  // Add one to the wrong tries
  attempts.count = attempts.count + 1;

  // Too many wrong tries: lock the account for a while
  if (attempts.count >= MAX_ATTEMPTS) {
    // Start counting from zero again after the lock
    attempts.count = 0;
    // Save the time when the lock ends
    attempts.lockedUntil = Date.now() + LOCK_SECONDS * 1000;
    // Save the new counter
    saveAttempts(email, attempts);
    // Tell the user the account is locked
    showMessage("Too many wrong tries. This account is locked for " + LOCK_SECONDS + " seconds.", "error");
    return;
  }

  // Save the new counter
  saveAttempts(email, attempts);
  // Not locked yet: tell the user how many tries are left
  const triesLeft = MAX_ATTEMPTS - attempts.count;
  // Tell the user it was wrong (the same message for a wrong email or a wrong password)
  showMessage("Wrong email or password. You have " + triesLeft + " tries left.", "error");
}

// Runs when the user presses the Log in button
async function handleLogin(event) {
  // Stop the browser from reloading the page when the form is sent
  event.preventDefault();

  // Read what the user typed
  const email = loginForm.email.value.trim().toLowerCase();
  // Passwords are not trimmed because spaces can be part of a password
  const password = loginForm.password.value;
  // Get the wrong-try counter for this email
  const attempts = getAttempts(email);

  // Stop here if the account is locked
  if (isLocked(attempts)) {
    // Tell the user how long to wait
    showMessage("Too many wrong tries. Please wait " + secondsLeft(attempts) + " seconds.", "error");
    return;
  }

  // Turn the button off while we check, so it cannot be pressed twice
  loginButton.disabled = true;

  // Find the account. If it does not exist we still scramble a fake password, so the answer takes the same time
  const user = findUser(email);
  // Use a fake salt unless the account exists
  let salt = "no-such-user";
  // The account exists, so use its real salt
  if (user !== null) {
    salt = user.salt;
  }
  // Scramble what the user typed with the same salt as the saved password
  const hash = await hashPassword(password, salt);

  // Turn the button back on
  loginButton.disabled = false;

  // No account with this email
  if (user === null) {
    // Count this as a wrong try and show a message
    handleWrongPassword(email, attempts);
    return;
  }

  // The password is wrong
  if (hash !== user.hash) {
    // Count this as a wrong try and show a message
    handleWrongPassword(email, attempts);
    return;
  }

  // Everything is correct: reset the counter, start the login and go to the home page
  clearAttempts(email);
  // Save the login
  startSession(user);
  // Go to the home page
  window.location.href = "index.html";
}

// Sets up the login page when it opens
function startLoginPage() {
  // Already logged in? Go straight to the home page
  if (alreadyLoggedIn()) {
    // Go to the home page
    window.location.href = "index.html";
    return;
  }

  // Stop if the browser has no tools for scrambling passwords
  if (!window.crypto || !window.crypto.subtle) {
    // Tell the user why
    showMessage("This browser cannot log you in safely. Please use a recent Chrome, Firefox or Edge.", "error");
    // Turn the button off because logging in is not possible here
    loginButton.disabled = true;
    return;
  }

  // Show a green message when the user was just sent here after creating an account
  if (window.location.search.includes("registered")) {
    // Show the green success message
    showMessage("Your account was created. You can log in now.", "success");
  }

  // Run handleLogin when the form is sent
  loginForm.addEventListener("submit", handleLogin);
}

// Start the page
startLoginPage();
