import { sharpness, sharpnessLabel } from '../data/evans.ts';

export default function SharpnessMeter({ id, size = 'sm', label = true }: { id: string; size?: 'sm' | 'lg'; label?: boolean }) {
  const value = sharpness[id] ?? 3;
  return (
    <span className={`sharpness-wrap ${size === 'lg' ? 'sharpness-lg-wrap' : ''}`}>
      <span className={`sharpness sharpness-${size} heat-${value}`} role="img"
        aria-label={`Agudeza ${value} de 5: ${sharpnessLabel(value)}`} title={`Agudeza ${value}/5 · ${sharpnessLabel(value)}`}>
        {[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= value ? 'on' : ''} />)}
      </span>
      {label && <span className="sharpness-label">{sharpnessLabel(value)}</span>}
    </span>
  );
}
