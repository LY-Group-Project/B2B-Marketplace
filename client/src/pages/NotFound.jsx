import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();

    useEffect(() => {
        const prev = document.title;
        document.title = "404 — Page not found";
        return () => {
            document.title = prev;
        };
    }, []);

    return (
        <main
            role="main"
            aria-labelledby="notfound-title"
            style={{
                minHeight: "70vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: 720,
                    textAlign: "center",
                }}
            >
                <div
                    aria-hidden
                    style={{
                        fontSize: 96,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "#f05a28",
                        marginBottom: 8,
                    }}
                >
                    404
                </div>
                <h1
                    id="notfound-title"
                    style={{
                        margin: "0 0 0.25rem",
                        fontSize: 28,
                        fontWeight: 600,
                        color: "#222",
                    }}
                >
                    Page not found
                </h1>
                <p style={{ margin: "0 0 1.25rem", color: "#555" }}>
                    The page you’re looking for doesn’t exist or has been moved.
                </p>

                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <Link
                        to="/"
                        style={{
                            display: "inline-block",
                            padding: "10px 18px",
                            background: "#0366d6",
                            color: "#fff",
                            borderRadius: 6,
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        Go to home
                    </Link>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{
                            padding: "10px 18px",
                            background: "transparent",
                            border: "1px solid #ccc",
                            color: "#222",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                        }}
                    >
                        Go back
                    </button>
                </div>
            </div>
        </main>
    );
}