import Link from 'next/link';
import './site.css';

export default function NotFound() {
  return (
    <div className="site">
      <div className="lost">
        <p>404, nothing swims here.</p>
        <Link href="/">← back home</Link>
      </div>
    </div>
  );
}
