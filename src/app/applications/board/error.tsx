"use client";

export default function BoardError({ reset }: { error: Error; reset: () => void }) {
  return <div className="panel error-state">
    <h1>Could not load the board</h1>
    <p>Please try again. Your applications have not been changed.</p>
    <button className="button button-primary" type="button" onClick={reset}>Try again</button>
  </div>;
}
