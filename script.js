// DOM Elements
const bookContainer = document.getElementById("book-container");
const genreFilters = document.getElementById("genre-filters");
const searchInput = document.getElementById("search-input");
const clearFavoritesBtn = document.getElementById("clear-favorites");
const sortSelect = document.getElementById("sort-select");
const toggleFavoritesBtn = document.getElementById("toggle-favorites");
const categorySelect = document.getElementById("category-select");

let searchQuery = "";
let sortBy = "";
let selectedGenre = "All";
let showFavoritesOnly = false;
let favoriteBooks = JSON.parse(localStorage.getItem("favorites")) || [];
let books = []; // will be filled after fetching
let isLoading = false;
// Fetch books for a category
async function fetchBooks(category = "fiction") {
  try {
    isLoading = true;
    renderBooks(); // Show loading message

    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(category)}&limit=50`);
    const data = await response.json();

    books = data.docs.map((book, index) => ({
      id: index + 1,
      title: book.title || "Unknown Title",
      author: (book.author_name && book.author_name[0]) || "Unknown Author",
      genre: (book.subject && book.subject[0]) || category,
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "https://via.placeholder.com/128x193?text=No+Cover",
    }));

    selectedGenre = "All"; // Reset genre filter
    updateGenres();
    renderGenreFilters();
    isLoading = false;
    renderBooks();
  } catch (error) {
    isLoading = false;
    bookContainer.innerHTML = "<p>Error fetching books. Please try again.</p>";
    console.error("Error fetching books:", error);
  }
}

// Call fetchBooks initially
fetchBooks(categorySelect.value);

// When user changes category, fetch new books
categorySelect.addEventListener("change", () => {
  fetchBooks(categorySelect.value);
});

// Dynamically update genre filters
let genres = [];

function updateGenres() {
  genres = ["All", ...new Set(books.map(book => book.genre))];
}

// Render genre filter buttons
function renderGenreFilters() {
  genreFilters.innerHTML = "";

  genres.forEach(genre => {
    const btn = document.createElement("button");
    btn.textContent = genre;
    btn.classList.toggle("active", genre === selectedGenre);
    btn.addEventListener("click", () => {
      selectedGenre = genre;
      renderGenreFilters();
      renderBooks();
    });
    genreFilters.appendChild(btn);
  });
}

// Render book cards
function renderBooks() {
  bookContainer.innerHTML = "";

  if (isLoading) {
    bookContainer.innerHTML = "<p>Loading books...</p>";
    return;
  }

  let filtered = selectedGenre === "All"
    ? books
    : books.filter(book => book.genre === selectedGenre);

  if (showFavoritesOnly) {
    filtered = filtered.filter(book => favoriteBooks.includes(book.id));
  }

  if (searchQuery.trim()) {
    filtered = filtered.filter(book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (sortBy === "title") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "author") {
    filtered.sort((a, b) => a.author.localeCompare(b.author));
  }

  if (filtered.length === 0) {
    bookContainer.innerHTML = "<p>No books to display.</p>";
    return;
  }

  filtered.forEach(book => {
    const card = document.createElement("div");
    card.className = "book-card";

    card.innerHTML = `
      <button class="favorite-btn ${favoriteBooks.includes(book.id) ? "active" : ""}" title="Toggle Favorite">★</button>
      <img src="${book.cover}" alt="${book.title}" />
      <h3>${book.title}</h3>
      <p>by ${book.author}</p>
      <span class="genre-tag">${book.genre}</span>
    `;

    // Favorite toggle
    card.querySelector(".favorite-btn").addEventListener("click", () => {
      if (favoriteBooks.includes(book.id)) {
        favoriteBooks = favoriteBooks.filter(id => id !== book.id);
      } else {
        favoriteBooks.push(book.id);
      }
      localStorage.setItem("favorites", JSON.stringify(favoriteBooks));
      renderBooks();
    });

    bookContainer.appendChild(card);
  });
}
// Event listeners
toggleFavoritesBtn.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  toggleFavoritesBtn.classList.toggle("active", showFavoritesOnly);
  toggleFavoritesBtn.textContent = showFavoritesOnly ? "Show All Books" : "Show Favorites Only";
  renderBooks();
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderBooks();
});

clearFavoritesBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all favorites?")) {
    favoriteBooks = [];
    localStorage.removeItem("favorites");
    renderBooks();
  }
});

sortSelect.addEventListener("change", (e) => {
  sortBy = e.target.value;
  renderBooks();
});

// Fetch books on page load (optional, since we already call fetchBooks above)
// window.addEventListener("DOMContentLoaded", () => {
//   fetchBooks();
// });