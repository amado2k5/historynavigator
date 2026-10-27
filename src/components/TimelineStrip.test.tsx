import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TimelineStrip } from './TimelineStrip.tsx';
import type { TimeBrowserRecord } from '../types.ts';

const records: TimeBrowserRecord[] = [
  { id: 'event/a', kind: 'event', title: { en: 'First', ar: 'أول' }, date: { earliest: 600, latest: 600 } },
  { id: 'event/b', kind: 'event', title: { en: 'Second', ar: 'ثاني' }, date: { earliest: 700, latest: 700 } },
  { id: 'event/c', kind: 'event', title: { en: 'Third', ar: 'ثالث' } },
];

describe('TimelineStrip', () => {
  it('renders a dot per record in date order and selects on click', () => {
    const onSelect = vi.fn();
    render(<TimelineStrip records={records} currentId={null} onSelect={onSelect} lang="en" />);
    const nav = screen.getByRole('navigation', { name: 'Timeline' });
    expect(nav).toBeInTheDocument();
    const dots = screen.getAllByRole('button');
    expect(dots).toHaveLength(3);
    fireEvent.click(dots[0]);
    expect(onSelect).toHaveBeenCalledWith('event/a');
  });

  it('moves with arrow keys, Home and End', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(
      <TimelineStrip records={records} currentId="event/a" onSelect={onSelect} lang="en" />,
    );
    const nav = container.querySelector('nav')!;
    fireEvent.keyDown(nav, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenLastCalledWith('event/b');
    rerender(<TimelineStrip records={records} currentId="event/b" onSelect={onSelect} lang="en" />);
    fireEvent.keyDown(nav, { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenLastCalledWith('event/a');
    rerender(<TimelineStrip records={records} currentId="event/a" onSelect={onSelect} lang="en" />);
    fireEvent.keyDown(nav, { key: 'End' });
    expect(onSelect).toHaveBeenLastCalledWith('event/c');
    fireEvent.keyDown(nav, { key: 'Home' });
    expect(onSelect).toHaveBeenLastCalledWith('event/a');
  });

  it('mirrors arrow directions in RTL', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <TimelineStrip records={records} currentId="event/a" onSelect={onSelect} lang="ar" />,
    );
    const nav = container.querySelector('nav')!;
    fireEvent.keyDown(nav, { key: 'ArrowLeft' }); // forward in RTL
    expect(onSelect).toHaveBeenLastCalledWith('event/b');
  });
});
