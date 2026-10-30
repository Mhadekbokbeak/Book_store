import { useState, useEffect } from "react";
import api from "../services/api";

export default function Home() {
          const [books, setBooks] = useState([]);
          const [loading, setLoading] = useState(true);


          useEffect(() => {
                    const fetchBooks = async () => {
                              try {
                                        const res = await api.get('/books');
                                        setBooks(res.data.books);
                              } catch (error) {
                                        console.error('Failed to fetch books', error);
                              } finally {
                                        setLoading(false);
                              }
                    };

                    fetchBooks();
          }, []);

          if (loading) return <div className="text-center p-10">กำลังโหลดข้อมูลหนังสือ...</div>;

          return (
                    <div className="container mx-auto px-4 py-8">
                              <h1 className="text-3xl font-bold mb-6 text-gray-800">List of all book</h1>

                              {books.length === 0 ? (<p className="text-gray-500">Books not in systems</p>) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                  {books.map((book) => {
                                                            <div key={book._id} className="bg-white border rounded-lg shadow-sm p-4 flex flex-col justify-between">
                                                                      <div>
                                                                                <h2 className="text-xl font-semibold text-gray-800 mb-2">{book.title}</h2>
                                                                                <p className="text-gray-600 text-sm mb-1">The Author: {book.author}</p>
                                                                                <p className="text-blue-600 font-bold text-lg mb-4">Price: {book.price}</p>
                                                                      </div>
                                                                      <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition" onClick={() => alert(`added ${book.title} on cart`)}>
                                                                                Add to cart
                                                                      </button>
                                                            </div>

                                                  })}
                                        </div>
                              )}
                    </div>
          );

}