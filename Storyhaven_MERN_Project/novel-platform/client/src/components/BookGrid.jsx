import React from "react";

function BookCard({ book, onOpen, onShowProfile }) {
  return (
    <article className="book-card" key={book._id}>
      <button
        className="cover"
        onClick={() => onOpen(book)}
        aria-label={"Open " + book.title}
      >
        {book.cover ? (
          <img src={book.cover} alt="" />
        ) : (
          <span className="cover-art">
            <i>✦</i>
            <strong>{book.title}</strong>
            <em>{book.genre}</em>
          </span>
        )}
      </button>
      <div className="card-body">
        <span className="eyebrow">{book.genre}</span>
        <button className="title-link" onClick={() => onOpen(book)}>
          {book.title}
        </button>
        <button
          className="author"
          onClick={() => onShowProfile(book.author?._id)}
        >
          by {book.author?.username || "Unknown"}
        </button>
        <span className="muted">
          ✦ {book.votes?.length || 0} votes · {book.chapters?.length || 0} chapters
        </span>
      </div>
    </article>
  );
}

export default function BookGrid({ books, onOpen, onShowProfile }) {
  return (
    <div className="book-grid">
      {books.map((book) => (
        <BookCard
          key={book._id}
          book={book}
          onOpen={onOpen}
          onShowProfile={onShowProfile}
        />
      ))}
    </div>
  );
}
