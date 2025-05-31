const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve static files

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// In-memory storage for books
let books = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
  { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 },
  { id: 3, title: "1984", author: "George Orwell", year: 1949 }
];

let nextId = 4;

// Custom middleware for logging requests
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

app.use(requestLogger);

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
};

// Validation middleware for book data
const validateBook = (req, res, next) => {
  const { title, author } = req.body;
  
  if (!title || !author) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Title and author are required fields'
    });
  }
  
  if (typeof title !== 'string' || typeof author !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Title and author must be strings'
    });
  }
  
  next();
};

// Routes

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /books - Retrieve all books
app.get('/books', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    next(error);
  }
});

// GET /books/:id - Retrieve a specific book
app.get('/books/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    
    if (!book) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Book with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
});

// POST /books - Create a new book
app.post('/books', validateBook, (req, res) => {
  try {
    const { title, author, year } = req.body;
    
    const newBook = {
      id: nextId++,
      title: title.trim(),
      author: author.trim(),
      year: year || new Date().getFullYear()
    };
    
    books.push(newBook);
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: newBook
    });
  } catch (error) {
    next(error);
  }
});

// PUT /books/:id - Update an existing book
app.put('/books/:id', validateBook, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const bookIndex = books.findIndex(b => b.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Book with ID ${id} not found`
      });
    }
    
    const { title, author, year } = req.body;
    
    books[bookIndex] = {
      ...books[bookIndex],
      title: title.trim(),
      author: author.trim(),
      year: year || books[bookIndex].year
    };
    
    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: books[bookIndex]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /books/:id - Delete a book
app.delete('/books/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const bookIndex = books.findIndex(b => b.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Book with ID ${id} not found`
      });
    }
    
    const deletedBook = books.splice(bookIndex, 1)[0];
    
    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: deletedBook
    });
  } catch (error) {
    next(error);
  }
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found'
  });
});

// Apply error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Book Management API Server running on http://localhost:${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   GET    /books     - Get all books`);
  console.log(`   GET    /books/:id - Get book by ID`);
  console.log(`   POST   /books     - Create new book`);
  console.log(`   PUT    /books/:id - Update book`);
  console.log(`   DELETE /books/:id - Delete book`);
});

module.exports = app;