/**
 * FanServices - accessible matchday guidance and context-aware recommendations.
 *
 * Browser speech is progressive enhancement; operational recommendations are
 * explicitly marked as simulated until live provider integrations are connected.
 */

import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useStadiumStore } from '../../store/stadiumStore';
import type { FanServices as FanServicesData } from '../../types';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const TRANSPORT_LABELS = {
  metro: 'Metro',
  shuttle: 'Shuttle',
  rideshare: 'Rideshare (Uber)',
  walking: 'Walking',
} as const;

export const FanServices = () => {
  const stadiumId = useStadiumStore(s => s.stadiumId);
  const [services, setServices] = useState<FanServicesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speechStatus, setSpeechStatus] = useState('');
  const [showAvatar, setShowAvatar] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadServices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getFanServices(stadiumId);
        if (isCurrent) setServices(data);
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load fan services at the moment.'
          );
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadServices();
    return () => {
      isCurrent = false;
      window.speechSynthesis?.cancel();
    };
  }, [stadiumId]);

  const speak = (text: string, label: string) => {
    if (!('speechSynthesis' in window)) {
      setSpeechStatus('Voice navigation is not supported by this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setSpeechStatus(`${label} is playing.`);
    utterance.onend = () => setSpeechStatus(`${label} has finished.`);
    utterance.onerror = () => setSpeechStatus('Voice guidance could not be played.');
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading && !services) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner label="Loading fan services..." size="lg" />
      </div>
    );
  }

  if (error && !services) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!services) return null;

  const { accessibility, food_recommendation: food, transport } = services;

  return (
    <section aria-label="Fan services" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
            Inclusive Matchday Services
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{services.stadium_name}</h1>
        </div>
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink">
          Simulated service data
        </span>
      </div>

      <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink">
        {services.data_notice}
      </p>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Accessible visitor support</h2>
            <p className="mt-1 text-sm text-ink">
              Voice navigation, wheelchair routes, captions, audio description, and an avatar-ready
              sign-language script.
            </p>
          </div>
          <button
            type="button"
            onClick={() => speak(accessibility.voice_navigation, 'Voice navigation')}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
          >
            Start voice navigation
          </button>
        </div>

        <p className="mt-4 rounded-xl border border-line bg-canvas p-3 text-sm text-ink">
          <span className="font-semibold text-ink">Wheelchair route:</span>{' '}
          {accessibility.wheelchair_route}
        </p>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-ink">
          {speechStatus}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-canvas p-4">
            <h3 className="font-semibold text-slate-900">Sign-language avatar</h3>
            <p className="mt-1 text-sm text-slate-600">
              The avatar integration has a concise, venue-specific script ready for a qualified
              sign-language provider.
            </p>
            <button
              type="button"
              aria-expanded={showAvatar}
              aria-controls="avatar-script"
              onClick={() => setShowAvatar(value => !value)}
              className="mt-3 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {showAvatar ? 'Hide avatar script' : 'Show avatar script'}
            </button>
            {showAvatar && (
              <div id="avatar-script" className="mt-3 rounded-lg bg-surface p-3 text-sm text-ink">
                <p className="font-semibold">Avatar preview script</p>
                <p className="mt-1">{accessibility.sign_language_avatar_script}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-line bg-canvas p-4">
            <h3 className="font-semibold text-slate-900">Captions and audio description</h3>
            <p className="mt-1 text-sm text-slate-600">{accessibility.audio_description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCaptions(value => !value)}
                aria-expanded={showCaptions}
                className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                {showCaptions ? 'Hide live caption preview' : 'Show live caption preview'}
              </button>
              <button
                type="button"
                onClick={() => speak(accessibility.audio_description, 'Audio description')}
                className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                Play audio description
              </button>
            </div>
            {showCaptions && (
              <p role="status" aria-live="polite" className="mt-3 rounded-lg bg-slate-900 p-3 text-sm text-white">
                {accessibility.live_caption_preview}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
            AI food recommendation
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink">{food.recommended_venue}</h2>
          <p className="mt-1 text-sm text-ink">Near {food.nearby_landmark}</p>
          <p className="mt-4 text-sm text-ink">{food.reasoning}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-canvas p-3">
              <dt className="text-ink">Estimated wait</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{food.estimated_wait_minutes} min</dd>
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <dt className="text-ink">Kickoff</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{food.kickoff_in_minutes} min</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
            Transportation assistant
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink">Choose your arrival mode</h2>
          <p className="mt-2 text-sm text-ink">{transport.weather_summary}</p>
          <p className="text-sm text-ink">{transport.delay_summary}</p>
          <ul className="mt-4 space-y-3" aria-label="Transport recommendations">
            {transport.options.map(option => (
              <li key={option.mode} className="rounded-xl border border-line bg-canvas p-3">
                <h3 className="font-semibold text-ink">{TRANSPORT_LABELS[option.mode]}</h3>
                <p className="mt-1 text-sm text-ink">{option.recommendation}</p>
                <p className="mt-1 text-xs text-ink">{option.reason}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
};
