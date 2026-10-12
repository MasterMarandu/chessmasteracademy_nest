import { ecoFor, makeGame, type Lesson } from '../data/evans.ts';

export function downloadFile(content: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/x-chess-pgn;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** PGN fiel: los metadatos salen de los datos y el título dice la verdad sobre el contenido. */
export function buildPgn(item: Lesson | null, sequence: string[]): string {
  const result = makeGame([]);
  const original = item?.moves.join() === sequence.join();
  sequence.forEach((move, index) => {
    result.move(move);
    if (original && item?.notes[index + 1]) result.setComment(item.notes[index + 1]);
  });
  result.setHeader('Event', item
    ? (original ? item.title : `Análisis libre a partir de ${item.title}`)
    : 'Análisis libre · Apertura Italiana');
  result.setHeader('White', item?.players?.white ?? 'Blancas');
  result.setHeader('Black', item?.players?.black ?? 'Negras');
  if (item?.year) result.setHeader('Date', String(item.year));
  // El código ECO sólo se declara donde está verificada la familia.
  if (item && item.family !== 'italian') result.setHeader('ECO', ecoFor(sequence));
  if (original && item?.result) result.setHeader('Result', item.result);
  return result.pgn();
}
