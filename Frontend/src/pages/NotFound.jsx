import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Oops, this page doesn't exist.</p>
      <Link to="/" className="btn-primary">
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;
