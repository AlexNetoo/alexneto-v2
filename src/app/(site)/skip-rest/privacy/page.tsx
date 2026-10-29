import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Skip Rest privacy policy',
  description: 'Skip Rest is a free iPhone app with no login. It does not collect any personal data.',
};

const points = [
  ['No account', 'Skip Rest is free and has no login, sign-up or account of any kind.'],
  ['Stored on your iPhone', 'Your workouts, finished workouts and settings (like light or dark mode) are saved only on your device. They are never sent to me or anyone else.'],
  ['No tracking', 'There are no analytics, ads or tracking, and no third-party services that collect data.'],
  ['Deleting', 'Delete the app and everything it stored is deleted with it.'],
  ['Email', 'If you email me for support, I only use your address to reply.'],
] as const;

/** Privacy policy linked from the App Store listing. */
export default function SkipRestPrivacyPage() {
  return (
    <div className="about">
      <header className="about__head rise">
        <div>
          <h1>Skip Rest privacy policy</h1>
          <p className="about__role">Last updated 29 October 2026</p>
          <div className="about__copy">
            <p>Skip Rest does not collect any personal data.</p>
            <p>It’s a free workout timer for iPhone, made by {site.name}.</p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="section__label">In short</h2>
        <div className="rows">
          {points.map(([title, text]) => (
            <div key={title} className="row">
              <span className="row__when">{title}</span>
              <span className="row__what">{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section__label">Questions</h2>
        <div className="contact-links">
          <a href={`mailto:${site.email}?subject=Skip%20Rest%20privacy`}>{site.email}</a>
          <Link href="/skip-rest">skip rest support</Link>
        </div>
      </section>
    </div>
  );
}
