import { useLocation } from 'react-router-dom';

export function JourneyProgress() {
  const { pathname } = useLocation();
  if (!pathname.startsWith('/review/')) return null;
  const current = pathname.endsWith('/start') ? 0 : pathname.endsWith('/consent') ? 2 : 1;
  return <div className="journey-wrap"><ol className="journey-progress" aria-label="Your review progress">
    {['Introduce yourself', 'Share your visit', 'Check & send'].map((label, index) => <li key={label} className={index === current ? 'is-current' : index < current ? 'is-complete' : ''} aria-current={index === current ? 'step' : undefined}><span aria-hidden="true">{index < current ? '✓' : index + 1}</span><strong>{label}</strong></li>)}
  </ol><p>Your perspective matters. Take it one step at a time.</p></div>;
}
