import Link from 'next/link';
import './site.css';

export default function NotFound() {
  return (
    <div className="site">
      <div className="lost">
        <p>404, nothing swims here.</p>
        <Link href="/">← back to the pond</Link>
      </div>
    </div>
  );
}
