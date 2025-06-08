const API_BASE = 'http://localhost:3000';
let editingId = null;

// DOM Elements
const bookForm = document.getElementById('bookForm');
const messageDiv = document.getElementById('message');
const booksGrid = document.getElementById('booksGrid');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const totalBooksSpan = document.getElementById('totalBooks');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
});

// Show message
function showMessage(text, type = 'success') {
    messageDiv.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Load all books
async function loadBooks() {
    try {
        booksGrid.innerHTML = '<div class="loading"></div>';
        const response = await fetch(`${API_BASE}/books`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            displayBooks(result.data);
            updateStats(result.data.length);
        } else {
            throw new Error(result.message || 'Failed to load books');
        }
    } catch (error) {
        console.error('Load books error:', error);
        let errorMessage = 'Error loading books: ';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += 'Cannot connect to server. Make sure the server is running on http://localhost:3000';
        } else {
            errorMessage += error.message;
        }
        
        showMessage(errorMessage, 'error');
        booksGrid.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Connection Error</h3>
                <p>Cannot connect to the API server.</p>
                <p>Make sure the server is running on port 3000.</p>
                <button class="btn btn-primary" onclick="loadBooks()" style="margin-top: 15px;">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

// Display books
function displayBooks(books) {
    if (books.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state">
                <h3>No books found</h3>
                <p>Add your first book using the form above!</p>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = books.map(book => `
        <div class="book-card">
            <div class="book-title">${escapeHtml(book.title)}</div>
            <div class="book-author">by ${escapeHtml(book.author)}</div>
            <div class="book-year">📅 ${book.year || 'Unknown'}</div>
            <div class="book-actions">
                <button class="btn btn-update" onclick="editBook(${book.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-delete" onclick="deleteBook(${book.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Update stats
function updateStats(count) {
    totalBooksSpan.textContent = count;
}

// Handle form submission
bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(bookForm);
    const bookData = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        year: formData.get('year') ? parseInt(formData.get('year')) : undefined
    };

    if (!bookData.title || !bookData.author) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    try {
        submitBtn.innerHTML = '<div class="loading"></div>';
        
        const url = editingId ? `${API_BASE}/books/${editingId}` : `${API_BASE}/books`;
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message);
            bookForm.reset();
            resetForm();
            loadBooks();
        } else {
            throw new Error(result.message || 'Operation failed');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        let errorMessage = 'Error: ';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += 'Cannot connect to server. Make sure the server is running.';
        } else {
            errorMessage += error.message;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        submitBtn.innerHTML = editingId ? 'Update Book' : 'Add Book';
    }
});

// Edit book
async function editBook(id) {
    try {
        const response = await fetch(`${API_BASE}/books/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const book = result.data;
            document.getElementById('title').value = book.title;
            document.getElementById('author').value = book.author;
            document.getElementById('year').value = book.year || '';
            
            editingId = id;
            submitBtn.textContent = 'Update Book';
            submitBtn.className = 'btn btn-update';
            cancelBtn.style.display = 'inline-block';
            
            document.getElementById('title').focus();
            showMessage('Editing mode: Update the book details', 'success');
        } else {
            throw new Error(result.message || 'Failed to load book');
        }
    } catch (error) {
        showMessage('Error loading book: ' + error.message, 'error');
    }
}

// Delete book
async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/books/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message);
            loadBooks();
        } else {
            throw new Error(result.message || 'Delete failed');
        }
    } catch (error) {
        showMessage('Error deleting book: ' + error.message, 'error');
    }
}

// Reset form
function resetForm() {
    editingId = null;
    submitBtn.textContent = 'Add Book';
    submitBtn.className = 'btn btn-primary';
    cancelBtn.style.display = 'none';
}

// Cancel edit
cancelBtn.addEventListener('click', () => {
    bookForm.reset();
    resetForm();
    showMessage('Edit cancelled', 'success');
});

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editingId) {
        cancelBtn.click();
    }
});
