// ===== Register page script =====

// The smallest age allowed to create an account
const MIN_AGE = 13;

// Find the form, the button and the message box on the page
const registerForm = document.getElementById("register-form");
const registerButton = registerForm.querySelector("button");
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

// Make a random text (salt) that is mixed into the password before it is scrambled
function makeSalt() {
  // The characters a salt can be made of
  const letters = "abcdefghijklmnopqrstuvwxyz0123456789";
  // Make room for 16 random numbers
  const bytes = new Uint8Array(16);
  // Fill them with random numbers from the browser
  crypto.getRandomValues(bytes);
  // The salt starts empty and grows one character at a time
  let salt = "";
  // Turn each random number into one character
  for (let i = 0; i < bytes.length; i++) {
    // Use the random number to pick a character
    salt = salt + letters[bytes[i] % letters.length];
  }
  // Give back the finished salt
  return salt;
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

// ===== Password and form checks =====

// Check if the text has at least one capital letter (A to Z)
function hasUppercase(text) {
  // Look at every character
  for (let i = 0; i < text.length; i++) {
    // Is this character a capital letter?
    if (text[i] >= "A" && text[i] <= "Z") {
      return true;
    }
  }
  return false;
}

// Check if the text has at least one small letter (a to z)
function hasLowercase(text) {
  // Look at every character
  for (let i = 0; i < text.length; i++) {
    // Is this character a small letter?
    if (text[i] >= "a" && text[i] <= "z") {
      return true;
    }
  }
  return false;
}

// Check if the text has at least one number (0 to 9)
function hasNumber(text) {
  // Look at every character
  for (let i = 0; i < text.length; i++) {
    // Is this character a number?
    if (text[i] >= "0" && text[i] <= "9") {
      return true;
    }
  }
  return false;
}

// A username must be 3 to 20 characters and use only letters, numbers and underscores
function usernameIsValid(username) {
  // These are the only characters a username may use
  const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
  // Too short or too long
  if (username.length < 3 || username.length > 20) {
    return false;
  }
  // Check every character of the username
  for (let i = 0; i < username.length; i++) {
    // This character is not allowed
    if (!allowed.includes(username[i])) {
      return false;
    }
  }
  return true;
}

// Simple email check: no spaces, an @ sign, and a dot with some letters after it
function emailIsValid(email) {
  // An email cannot have spaces
  if (email.includes(" ")) {
    return false;
  }
  // Find the @ sign. It must not be the first character
  const atPosition = email.indexOf("@");
  // There is no @ sign, or it is the first character
  if (atPosition < 1) {
    return false;
  }
  // Find the last dot. It must come after the @ and must not be the last character
  const dotPosition = email.lastIndexOf(".");
  // There is no dot after the @, or no letters between them
  if (dotPosition < atPosition + 2) {
    return false;
  }
  // The dot is the last character
  if (dotPosition === email.length - 1) {
    return false;
  }
  return true;
}

// Check that the birthday is real, not in the future, and old enough
function ageIsOk(birthday) {
  // No date was chosen
  if (birthday === "") {
    return false;
  }
  // Turn the birthday text into a date and get today's date
  const born = new Date(birthday);
  const today = new Date();
  // The birthday is in the future
  if (born > today) {
    return false;
  }
  // Start with the difference in years, then take one off if the birthday has not happened yet this year
  let age = today.getFullYear() - born.getFullYear();
  // Months between this month and the birth month
  const monthGap = today.getMonth() - born.getMonth();
  // The birthday month has not come yet this year, so take one year off
  if (monthGap < 0) {
    age = age - 1;
  }
  // It is the birthday month but the day has not come yet, so take one year off
  if (monthGap === 0 && today.getDate() < born.getDate()) {
    age = age - 1;
  }
  // The person is too young
  if (age < MIN_AGE) {
    return false;
  }
  return true;
}

// Check if another account already uses this email
function emailIsTaken(email, users) {
  // Check every saved account
  for (let i = 0; i < users.length; i++) {
    // Same email found
    if (users[i].email === email) {
      return true;
    }
  }
  return false;
}

// Check if another account already uses this username (capital letters do not matter)
function usernameIsTaken(username, users) {
  // Check every saved account
  for (let i = 0; i < users.length; i++) {
    // Same username found
    if (users[i].username.toLowerCase() === username.toLowerCase()) {
      return true;
    }
  }
  return false;
}

// Check every rule one by one. Gives back the first problem as text, or empty text if everything is fine
function checkForm(values, users) {
  // Full name needs at least 2 characters
  if (values.fullname.length < 2) {
    return "Please enter your full name.";
  }

  // Username must follow the username rules
  if (!usernameIsValid(values.username)) {
    return "Your username must be 3 to 20 characters. Use only letters, numbers and underscores.";
  }

  // Email must look like a real email
  if (!emailIsValid(values.email)) {
    return "Please enter a real email address.";
  }

  // User must be old enough
  if (!ageIsOk(values.birthday)) {
    return "You must be at least " + MIN_AGE + " years old to join.";
  }

  // Password rules: at least 8 characters, a capital letter, a small letter and a number
  if (values.password.length < 8) {
    return "Your password must be at least 8 characters long.";
  }

  // No capital letter
  if (!hasUppercase(values.password)) {
    return "Your password needs at least one capital letter.";
  }

  // No small letter
  if (!hasLowercase(values.password)) {
    return "Your password needs at least one small letter.";
  }

  // No number
  if (!hasNumber(values.password)) {
    return "Your password needs at least one number.";
  }

  // Password must not contain the username or the first part of the email
  const lowerPassword = values.password.toLowerCase();
  // The part of the email before the @ sign
  const emailName = values.email.split("@")[0];

  // The password contains the username
  if (lowerPassword.includes(values.username.toLowerCase())) {
    return "Your password must not contain your username.";
  }

  // The password contains the email name
  if (lowerPassword.includes(emailName)) {
    return "Your password must not contain the first part of your email.";
  }

  // Both password boxes must match
  if (values.password !== values.confirm) {
    return "The two passwords are not the same.";
  }

  // Email and username must not be used by another account
  if (emailIsTaken(values.email, users)) {
    return "There is already an account with this email.";
  }

  if (usernameIsTaken(values.username, users)) {
    return "This username is already taken.";
  }

  // No problems found
  return "";
}

// ===== Sending the form =====

// Runs when the user presses the Create account button
async function handleRegister(event) {
  // Stop the browser from reloading the page when the form is sent
  event.preventDefault();

  // Read everything the user typed into the form
  const values = {
    fullname: registerForm.fullname.value.trim(),
    username: registerForm.username.value.trim(),
    email: registerForm.email.value.trim().toLowerCase(),
    birthday: registerForm.birthday.value,
    genre: registerForm.genre.value,
    password: registerForm.password.value,
    confirm: registerForm.confirm.value
  };

  // Get the saved accounts so we can check for duplicates
  const users = getUsers();
  // Run all the checks
  const problem = checkForm(values, users);

  // If a rule was broken, show the problem and stop
  if (problem !== "") {
    // Show the problem in red
    showMessage(problem, "error");
    return;
  }

  // Turn the button off so it cannot be pressed twice
  registerButton.disabled = true;

  // Make a salt and scramble the password
  const salt = makeSalt();
  // Scramble the password with the new salt
  const hash = await hashPassword(values.password, salt);

  // Build the new account. Only the scrambled password (hash) is saved, never the real one
  const newUser = {
    fullname: values.fullname,
    username: values.username,
    email: values.email,
    birthday: values.birthday,
    genre: values.genre,
    salt: salt,
    hash: hash,
    created: Date.now()
  };

  // Save the account and send the user to the login page
  users.push(newUser);
  // Save the whole list of accounts in the browser
  localStorage.setItem("users", JSON.stringify(users));
  // Go to the login page. The ?registered=1 part makes it show a success message
  window.location.href = "login.html?registered=1";
}

// Sets up the register page when it opens
function startRegisterPage() {
  // Already logged in? Go straight to the home page
  if (alreadyLoggedIn()) {
    // Go to the home page
    window.location.href = "index.html";
    return;
  }

  // Stop if the browser has no tools for scrambling passwords
  if (!window.crypto || !window.crypto.subtle) {
    // Tell the user why
    showMessage("This browser cannot create accounts safely. Please use a recent Chrome, Firefox or Edge.", "error");
    // Turn the button off because registering is not possible here
    registerButton.disabled = true;
    return;
  }

  // Run handleRegister when the form is sent
  registerForm.addEventListener("submit", handleRegister);
}

// Start the page
startRegisterPage();
