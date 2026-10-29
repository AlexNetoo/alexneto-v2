import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Skip Rest',
  description: 'Skip Rest is a free interval and superset timer for iPhone. No login, no account. Support and contact.',
};

const faq = [
  {
    q: 'Do I need an account?',
    a: 'No. Skip Rest is free and has no login or sign-up. Open it and start a workout.',
  },
  {
    q: 'Where are my workouts saved?',
    a: 'Only on your iPhone. Nothing is uploaded, so deleting the app deletes your workouts and history too.',
  },
  {
    q: 'I can’t hear the countdown',
    a: 'Turn the volume up. The beeps play over your music and even with the silent switch on, but they follow the media volume.',
  },
  {
    q: 'Can I add an exercise without naming it?',
    a: 'Yes. Leave the name blank and it plays as “Exercise 1”, “Exercise 2” and so on.',
  },
  {
    q: 'How do I pin or delete a workout?',
    a: 'On the home screen, swipe a workout right to pin it to the top, or left to delete it. Long-press for more options.',
  },
  {
    q: 'How do I switch to dark mode?',
    a: 'Tap the gear on the home screen, then Appearance.',
  },
];

/** App Store support page for Skip Rest. Same layout as the About page. */
export default function SkipRestPage() {
  return (
    <div className="about">
      <header className="about__head rise">
        <div>
          <h1>Skip Rest</h1>
          <p className="about__role">Interval and superset timer for iPhone · Free, no login</p>
          <div className="about__copy">
            <p>Build timed workouts with supersets and rest, then let the timer run.</p>
            <p>
              Skip Rest is free, with no account, no ads and no tracking. Everything you create stays on your iPhone.
            </p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="section__label">Questions</h2>
        <div className="rows">
          {faq.map((f) => (
            <div key={f.q} className="row" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
              <span className="row__what">
                {f.q}
                <span>{f.a}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section__label">Get in touch</h2>
        <div className="about__copy" style={{ marginTop: 0 }}>
          <p>Found a bug or have an idea? Email me and I’ll get back to you.</p>
        </div>
        <div className="contact-links" style={{ marginTop: 20 }}>
          <a href={`mailto:${site.email}?subject=Skip%20Rest`}>{site.email}</a>
          <Link href="/skip-rest/privacy">privacy policy</Link>
        </div>
      </section>
    </div>
  );
}
