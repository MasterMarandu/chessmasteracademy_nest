import { Chess } from 'chess.js';

export type LessonKind = 'variant' | 'trap' | 'game';
export type Family = 'accepted' | 'declined' | 'other' | 'italian';
export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  notation: string;
  kind: LessonKind;
  family: Family;
  level: 'Esencial' | 'Intermedia' | 'Avanzada';
  moves: string[];
  startPly: number;
  description: string;
  whitePlan: string;
  blackPlan: string;
  warning: string;
  notes: Record<number, string>;
  defendingSide?: 'white' | 'black';
  defenseMoves?: string[];
  /** Celada de orden de jugadas: lo que se castiga es una jugada ilegal, no hay línea perdedora que mostrar. */
  orderTrap?: boolean;
  source?: string;
  // Metadatos de la partida, para exportar PGN fiel sin adivinar en el exportador.
  players?: { white: string; black: string };
  result?: '1-0' | '0-1' | '1/2-1/2';
  year?: number;
}

// The shared trunk of the Italian Game: both the Giuoco Piano and the Evans
// Gambit leave this position, so every line in the library starts here.
export const TRUNK = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'];

export const BASE = [...TRUNK, 'b4'];
const accepted = [...BASE, 'Bxb4', 'c3'];
const line = (continuation: string) => [...accepted, ...continuation.split(' ')];
const fromBase = (continuation: string) => [...BASE, ...continuation.split(' ')];

export const baseNotes: Record<number, string> = {
  0: 'Has llegado al inicio del Evans. Elige una variante a la derecha para cargarla en el tablero, o haz clic en "Empieza aquí" para ir directo.',
  1: 'e4 ocupa el centro y abre diagonales para la dama y el alfil de f1.',
  2: 'Las negras responden con e5, disputando el centro desde el primer movimiento.',
  3: 'Cf3 se desarrolla con una amenaza: ataca el peón de e5.',
  4: 'Cc6 defiende e5 y prepara el desarrollo del flanco de rey.',
  5: 'Ac4 mira a f7, el punto más débil del rey negro al inicio de la partida.',
  6: 'La Apertura Italiana está sobre el tablero. Ahora las blancas cambian el ritmo.',
  7: '¡El gambito! Las blancas ofrecen el peón b4 para desviar el alfil de c5. La idea: ganar un tempo con c3, abrir el centro con d4 y desarrollar más rápido que las negras.',
};

// Notes for the shared Italian trunk, shown while no lesson is open.
export const italianNotes: Record<number, string> = {
  0: 'La apertura italiana empieza aquí. Elige una rama a la derecha para ver cómo cambia el carácter de la partida.',
  1: 'e4 ocupa el centro y abre diagonales para la dama y el alfil de f1.',
  2: 'Las negras responden simétricamente con e5.',
  3: 'Cf3 desarrolla y ataca e5.',
  4: 'Cc6 defiende e5 y controla d4.',
  5: 'Ac4 apunta a f7, el punto más débil del campo negro.',
  6: 'El tronco común: los dos bandos han desarrollado alfil y caballo y disputan el centro. Desde aquí, c3, d3 y b4 llevan a partidas completamente distintas.',
};

export const italianLines: Lesson[] = [
  {
    id: 'giuoco-classical', title: 'Giuoco Piano clásico', subtitle: '4. c3 abre el centro. La partida se decide calculando.',
    notation: '1. e4 e5 2. Cf3 Cc6 3. Ac4 Ac5 4. c3', kind: 'variant', family: 'italian', level: 'Intermedia',
    moves: [...TRUNK, ...'c3 Nf6 d4 exd4 cxd4 Bb4+ Nc3 Nxe4 O-O Bxc3 d5 Bf6 Re1 Ne7 Rxe4 d6'.split(' ')],
    startPly: 7,
    description: 'El Giuoco Piano clásico: c3 prepara d4 y deja la casilla c3 para el caballo. Si las negras capturan en e4, la partida entra en el ataque Møller, donde un peón importa menos que la iniciativa.',
    whitePlan: 'Juega d4, bloquea el jaque con el caballo de b1 y enroca. Con el rey a salvo, d5 gana espacio y Txe4 recupera la pieza. Cada jugada debe crear una amenaza.',
    blackPlan: 'Responde con ...Cf6 y ...Ab4+. Si tomas en e4, devuelve material a tiempo: ...Af6 y ...Cge7 sostienen la posición mientras completas el desarrollo.',
    warning: 'Es la línea más aguda del Giuoco Piano. La compensación blanca son diagonales y tiempos, no un ataque forzado: sin cálculo preciso, el peón de menos pesa.',
    notes: {
      6: 'La posición del Giuoco Piano: ambos bandos han desarrollado alfil y caballo y se disputan el centro.',
      7: 'c3 prepara d4 y reserva la casilla c3 para el caballo. Es la jugada que define el Giuoco Piano clásico.',
      8: 'Cf6 ataca e4 y vigila d5.',
      9: 'd4 golpea el centro. Las negras deben decidir: si capturan, las blancas recapturan con el peón de c3.',
      11: 'La recaptura con el peón deja a las blancas un centro móvil y la columna c semiabierta.',
      12: 'Ab4+ aprovecha que c3 quedó vacío: el alfil da jaque y obliga a las blancas a bloquear con una pieza.',
      14: 'Cxe4 gana un peón. El precio es el tiempo que tardará el caballo en volver a la partida.',
      15: 'El enroque pone al rey a salvo y deja la torre de f1 lista para atacar e4.',
      16: 'Axc3 elimina al defensor del centro y daña la estructura blanca. Es la jugada crítica de la línea.',
      17: 'd5 es el corazón del ataque Møller: el peón se ofrece para abrir líneas y ganar tiempos sobre el caballo de c6.',
      19: 'Te1 ataca al caballo de e4 y prepara la recuperación de la pieza.',
      21: 'Txe4 recupera la pieza. Las blancas tienen un peón de menos, pero todas sus piezas miran al rey negro.',
      22: 'd6 sostiene el centro y frena las rupturas blancas. La posición sigue siendo aguda: hay que calcular.',
    },
    source: 'https://es.wikipedia.org/wiki/Giuoco_Piano',
  },
  {
    id: 'giuoco-pianissimo', title: 'Giuoco Pianissimo', subtitle: '4. d3: la alternativa posicional al gambito.',
    notation: '1. e4 e5 2. Cf3 Cc6 3. Ac4 Ac5 4. d3', kind: 'variant', family: 'italian', level: 'Esencial',
    moves: [...TRUNK, ...'d3 Nf6 O-O d6 c3 a6 Bb3 Ba7 Re1 O-O'.split(' ')],
    startPly: 7,
    description: 'El «juego lentísimo»: las blancas renuncian a la ruptura inmediata y construyen una posición sólida. Es la elección de quien prefiere maniobrar antes que calcular.',
    whitePlan: 'Enroca pronto, sostén e4 con d3 y prepara c3 con calma. Mejora las piezas, ocupa la columna e y elige el momento de abrir el centro.',
    blackPlan: 'Copia el esquema: ...Cf6, ...d6, enroque y ...a6 con ...Aa7 para conservar el alfil. Busca ...Te8 y ...Ae6 antes de abrir la posición.',
    warning: 'No hay tácticas inmediatas ni una jugada que gane por sí sola. Sin un plan de desarrollo, la ventaja de espacio se evapora.',
    notes: {
      6: 'El mismo tronco que el Giuoco Piano clásico: la diferencia es la jugada siguiente.',
      7: 'd3 sostiene e4 y evita abrir el centro. Las blancas se reservan d4 para más adelante.',
      9: 'El enroque antes de definir el centro: el rey está seguro y la torre de f1 mira a la columna e.',
      10: 'd6 refuerza e5 y abre paso al alfil de c8.',
      11: 'c3 quiere jugar d4 en el momento oportuno. Es la idea del Giuoco Piano, pero con más piezas desarrolladas.',
      12: 'a6 prepara una retirada cómoda para el alfil antes de decidir el centro.',
      13: 'Ab3 aparta el alfil de c4, donde ...Ca5 y ...b5 lo molestarían, y mantiene la mira sobre f7.',
      14: 'Aa7 conserva el alfil en la diagonal y mantiene la presión sobre el centro.',
      15: 'Te1 ocupa la columna abierta: la torre entra en juego antes de que se defina la estructura.',
      16: 'Con los reyes seguros, empieza la maniobra. Aquí gana quien tenga las piezas mejor colocadas, no quien calcule más.',
    },
    source: 'https://es.wikipedia.org/wiki/Giuoco_Piano',
  },
];

export const variants: Lesson[] = [
  {
    id: 'main', title: 'Gambito aceptado', subtitle: 'La línea principal. El ataque empieza aquí.',
    notation: '4...Axb4 5. c3 Aa5', kind: 'variant', family: 'accepted', level: 'Esencial',
    moves: line('Ba5 d4 exd4 O-O d6 cxd4 Bb6'), startPly: 10,
    description: 'Las negras aceptan el peón y conservan la diagonal a5-e1. Las blancas cambian material por centro, desarrollo y posibilidades de ataque.',
    whitePlan: 'Juega d4 y enroca antes de recuperar en d4. Con el rey seguro, desarrolla el caballo de b1 y busca Db3 o Aa3 si la posición lo permite.',
    blackPlan: 'Refuerza el centro con ...d6, retira el alfil a b6 y completa el desarrollo. Devuelve un peón si con ello puedes enrocar sin exponerte.',
    warning: 'Después de 6...exd4, 7. cxd4 es ilegal: el peón de c3 está clavado al rey. Primero, 7. O-O.',
    notes: { 8: 'El alfil acepta la oferta. Las blancas podrán atacarlo con c3.', 9: 'c3 gana un tiempo sobre el alfil y prepara d4.', 10: 'Aa5 mantiene la clavada del peón de c3 contra el rey de e1.', 11: 'El centro importa más que recuperar de inmediato el peón.', 12: 'No captures en d4 todavía: tu peón de c3 está clavado.', 13: 'El enroque rompe la clavada y activa la torre. Ahora sí es posible cxd4.', 14: 'd6 facilita el desarrollo del alfil de c8 y frena e5.', 15: 'Las blancas recuperan el peón central y construyen el dúo d4-e4.', 16: 'La posición normal del Evans. Ambos bandos deben completar el desarrollo.' },
  },
  {
    id: 'lasker', title: 'Defensa Lasker', subtitle: 'Devolver material. Apagar la iniciativa.',
    notation: '5...Aa5 6. d4 d6', kind: 'variant', family: 'accepted', level: 'Esencial',
    moves: line('Ba5 d4 d6 O-O Bb6 dxe5 dxe5 Qxd8+ Nxd8 Nxe5 Be6'), startPly: 12,
    description: 'Una respuesta clásica y pragmática: mantener el centro, apartar el alfil y devolver el peón cuando favorezca la simplificación.',
    whitePlan: 'No cuentes con un ataque automático. Puedes conservar la tensión central; el cambio dxe5 permite a las negras simplificar.',
    blackPlan: 'Combina ...d6 y ...Ab6. En esta línea ilustrativa, ...dxe5 permite cambiar damas y devolver el peón con Cxe5, neutralizando el ataque.',
    warning: 'La defensa Lasker clásica incluye ...Aa5, ...d6 y ...Ab6. No debe confundirse sin más con la retirada inmediata 5...Ae7.',
    notes: { 12: 'd6 sostiene e5 sin abrir de inmediato el centro.', 14: 'El alfil se aparta de a5: las negras están dispuestas a devolver material.', 17: 'El cambio de damas reduce el valor de la iniciativa blanca.', 19: 'Las blancas recuperan el peón. Las negras han cambiado material por tranquilidad.', 20: 'Ae6 desarrolla una pieza y disputa la diagonal al alfil blanco.' },
  },
  {
    id: 'modern', title: 'Defensa moderna', subtitle: 'Una retirada flexible y un rey más seguro.',
    notation: '5...Ae7', kind: 'variant', family: 'accepted', level: 'Esencial',
    moves: line('Be7 d4 Na5 Be2 exd4 Qxd4 d6 O-O Nf6'), startPly: 10,
    description: 'El alfil se retira a e7, sin quedar expuesto a nuevos ataques de los peones. ...Ca5 gana un tiempo sobre el alfil blanco.',
    whitePlan: 'Ocupa el centro con d4 y conserva el alfil con Ae2 frente a ...Ca5. La dama puede recuperar en d4; vigila futuros ataques con ...Cc6.',
    blackPlan: 'Busca ...Ca5, ...d6 y ...Cf6. No te aferres al peón: la coordinación y el enroque son la prioridad.',
    warning: 'La retirada del alfil no elimina el ataque por sí sola. Un rey en el centro sigue siendo vulnerable a líneas abiertas.',
    notes: { 10: 'Ae7 abandona la clavada de c3, pero evita nuevos ataques al alfil.', 12: 'Ca5 ataca al alfil de c4.', 13: 'Ae2 conserva el alfil y despeja la primera fila para enrocar.', 15: 'La dama recupera en d4 sin sacrificar otro peón.', 18: 'Con el caballo desarrollado, las negras se preparan para enrocar.' },
  },
  {
    id: 'declined', title: 'Gambito rehusado', subtitle: 'Menos riesgo, una lucha por el espacio.',
    notation: '4...Ab6', kind: 'variant', family: 'declined', level: 'Esencial',
    moves: fromBase('Bb6 a4 a6 Nc3 Nf6 O-O d6'), startPly: 8,
    description: 'Las negras no aceptan el peón. Las blancas conservan material y ganan espacio en el flanco de dama, pero deben seguir desarrollándose.',
    whitePlan: 'Gana espacio con a4, desarrolla Cc3 y enroca. La estructura b4-a4 ofrece opciones en el flanco de dama sin exigir un ataque inmediato.',
    blackPlan: 'Juega ...a6 para ofrecer una retirada al alfil, seguido de ...Cf6 y ...d6. Ataca el centro si las blancas pierden tiempos con peones.',
    warning: 'No confundas espacio con desarrollo. Empujar b5 demasiado pronto puede permitir ...Cd4 y contrajuego central.',
    notes: { 8: 'Ab6 rehúsa el sacrificio y mantiene la presión sobre f2.', 9: 'a4 amenaza ganar más espacio con a5.', 10: 'a6 crea una casilla de escape en a7 para el alfil.', 11: 'Cc3 es la continuación de Showalter: desarrollo antes que más avances.', 14: 'Las negras adoptan una estructura sólida.' },
  },
  {
    id: 'classical', title: 'Defensa clásica', subtitle: 'El alfil vuelve a c5. El centro se abre.',
    notation: '5...Ac5', kind: 'variant', family: 'accepted', level: 'Intermedia',
    moves: line('Bc5 d4 exd4 O-O d6 cxd4 Bb6'), startPly: 10,
    description: 'La retirada a c5 invita a d4 con ganancia de tiempo. Con juego preciso, esta variante puede transponer a la posición normal del Evans.',
    whitePlan: 'Abre el centro con d4 y enroca. Si las negras capturan en c3, examina Axf7+ seguido de Dd5+ antes de recapturar mecánicamente.',
    blackPlan: 'Después de 7. O-O, elige ...d6 y prepara ...Ab6. Evita la captura codiciosa ...dxc3 con el alfil en c5.',
    warning: 'Con el alfil en c5, ...dxc3 permite Axf7+ y Dd5+, que recupera material con jaque.',
    notes: { 10: 'El alfil regresa a c5, donde d4 lo atacará con ganancia de tiempo.', 13: 'El enroque prioriza la actividad sobre la recaptura inmediata.', 14: 'd6 evita la celada sobre f7 y refuerza el centro.', 16: 'La posición coincide con la línea principal: esto es una transposición.' },
  },
  {
    id: 'stone-ware', title: 'Defensa Stone-Ware', subtitle: 'Sostener e5, a costa de algo de espacio.',
    notation: '5...Ad6', kind: 'variant', family: 'accepted', level: 'Intermedia',
    moves: line('Bd6 d4 Nf6 O-O O-O'), startPly: 10,
    description: 'El alfil defiende e5 desde d6. Es una idea compacta, aunque bloquea temporalmente el peón de d7 y al alfil de c8.',
    whitePlan: 'Construye el centro con d4, enroca y aprovecha tu ventaja de espacio. Desarrolla todas las piezas antes de sacrificar.',
    blackPlan: 'Desarrolla el caballo de g8 y enroca. Después, busca una ruta para el alfil de d6 que libere el peón de d7.',
    warning: 'La solidez tiene un precio: si las negras no liberan su flanco de dama, pueden quedar sin contrajuego.',
    notes: { 10: 'Ad6 defiende e5, pero dificulta el desarrollo del flanco de dama.', 12: 'Cf6 desarrolla una pieza y ataca e4.', 14: 'El rey está seguro, pero las negras aún deben resolver el bloqueo de d7.' },
  },
  {
    id: 'compromised', title: 'Defensa comprometida', subtitle: 'Aceptar más material y resistir el ataque.',
    notation: '7...dxc3', kind: 'variant', family: 'accepted', level: 'Avanzada',
    moves: line('Ba5 d4 exd4 O-O dxc3 Qb3 Qf6 e5 Qg6 Nxc3 Nge7 Ba3'), startPly: 14,
    description: 'Las negras capturan también en c3. La ventaja material crece, pero el retraso en desarrollo obliga a defender con precisión.',
    whitePlan: 'Activa la dama con Db3, gana tiempos con e5 y desarrolla Cxc3. Aa3 controla una diagonal que puede impedir el enroque negro.',
    blackPlan: 'Defiende f7, evita perder tiempos con la dama y busca ...Cge7. Una alternativa más sencilla es elegir 7...d6 antes de capturar.',
    warning: '7...dxc3 no es una refutación del gambito ni una derrota forzada. La actividad importa más que contar peones.',
    notes: { 14: 'Capturar en c3 aumenta la responsabilidad defensiva.', 15: 'Db3 prepara presión sobre f7.', 17: 'e5 gana un tiempo sobre la dama de f6.', 19: 'El caballo recupera en c3 y entra en juego.', 21: 'Aa3 vigila f8. El enroque negro necesita preparación adicional.' },
  },
  {
    id: 'anderssen', title: 'Defensa Anderssen', subtitle: 'Desarrollo rápido y contragolpe central.',
    notation: '7...Cf6', kind: 'variant', family: 'accepted', level: 'Avanzada',
    moves: line('Ba5 d4 exd4 O-O Nf6 e5 d5 exf6 dxc4'), startPly: 14,
    description: 'Las negras desarrollan el caballo y responden a e5 con ...d5. El centro se convierte en una lucha táctica.',
    whitePlan: 'e5 gana espacio y ataca al caballo. Calcula ...d5: si capturas en f6, tu alfil de c4 también queda atacado.',
    blackPlan: 'Frente a e5, no retires el caballo automáticamente. ...d5 contraataca al alfil y abre líneas para desarrollar las piezas.',
    warning: 'Una amenaza no siempre se responde retirándose. ...d5 permite intercambiar el caballo de f6 por el alfil de c4.',
    notes: { 14: 'Cf6 ataca e4, aunque permite e5.', 16: 'd5 ataca al alfil de c4: una amenaza responde a otra.', 18: 'Cada bando ha capturado una pieza menor. Ahora importa la coordinación.' },
  },
  {
    id: 'mieses', title: 'Defensa Mieses', subtitle: 'Preparar ...d5 sin exponer el caballo.',
    notation: '7...Cge7', kind: 'variant', family: 'accepted', level: 'Intermedia',
    moves: line('Ba5 d4 exd4 O-O Nge7 cxd4 d5 exd5 Nxd5'), startPly: 14,
    description: 'El caballo se desarrolla por e7. Desde allí apoya ...d5 sin quedar expuesto a e5.',
    whitePlan: 'Recupera el centro con cxd4, desarrolla el caballo de b1 y calcula los cambios después de ...d5.',
    blackPlan: 'Prepara ...d5. Devuelve parte del material para abrir líneas a tus piezas, en vez de mantener una defensa pasiva.',
    warning: 'El caballo de e7 parece menos activo, pero su flexibilidad permite disputar el centro.',
    notes: { 14: 'Cge7 evita que e5 gane un tiempo sobre el caballo.', 16: 'd5 es la ruptura liberadora.', 18: 'El caballo recupera en d5 y ocupa una casilla central activa.' },
  },
  {
    id: 'tartakower', title: 'Ataque Tartakower', subtitle: 'La dama entra pronto en la conversación.',
    notation: '6...d6 7. Db3', kind: 'variant', family: 'accepted', level: 'Intermedia',
    moves: line('Ba5 d4 d6 Qb3 Qd7 dxe5 dxe5 O-O Bb6'), startPly: 13,
    description: 'Las blancas desarrollan la dama a b3 antes de enrocar, creando presión táctica sobre f7.',
    whitePlan: 'Coordina dama y alfil contra f7. Enroca pronto: las amenazas al rey rival no deben distraerte de tu desarrollo.',
    blackPlan: 'Defiende f7 con ...Dd7 y sostén el centro. Busca ...Ab6 y desarrolla las piezas menores antes de perseguir peones.',
    warning: 'Db3 no amenaza un mate automático. El alfil de c4 ocupa la misma diagonal; calcula las secuencias con Axf7+.',
    notes: { 13: 'Db3 coloca la dama detrás del alfil, mirando hacia f7.', 14: 'Dd7 añade una defensa a f7.', 17: 'Las blancas ponen por fin su rey a salvo.' },
  },
  {
    id: 'alapin', title: 'Variante Alapin-Steinitz', subtitle: 'Una clavada para disputar la iniciativa.',
    notation: '6. O-O d6 7. d4 Ag4', kind: 'variant', family: 'accepted', level: 'Intermedia',
    moves: line('Ba5 O-O d6 d4 Bg4 Qb3 Qd7'), startPly: 14,
    description: 'Con el rey blanco ya enrocado, ...Ag4 clava el caballo de f3 a la dama y añade presión central.',
    whitePlan: 'Db3 sale de la clavada y vuelve a mirar f7. Valora el control central antes de atacar en el flanco de rey.',
    blackPlan: 'Desarrolla el alfil a g4 y prepara ...Dd7. Usa la presión sobre f3 sin descuidar el caballo de g8.',
    warning: 'Cambiar en f3 sin un motivo puede regalar a las blancas la pareja de alfiles y tiempos de ataque.',
    notes: { 11: 'Enrocar antes de d4 es otro orden de jugadas.', 14: 'Ag4 clava el caballo contra la dama de d1.', 15: 'Db3 rompe la clavada y mira f7.' },
  },
  {
    id: 'knight', title: 'Captura con el caballo', subtitle: 'Mismo peón, distinto orden de jugadas.',
    notation: '4...Cxb4', kind: 'variant', family: 'other', level: 'Intermedia',
    moves: fromBase('Nxb4 c3 Nc6 d4 exd4 O-O d6'), startPly: 8,
    description: 'El caballo acepta el peón. Tras c3 y ...Cc6, se transpone a la defensa clásica con el alfil en c5.',
    whitePlan: 'Ataca el caballo con c3 y sigue con d4. No te precipites con Cxe5: ...Df6 crea amenazas.',
    blackPlan: 'Retira el caballo a c6 y responde en el centro. Si las blancas capturan e5, calcula ...Df6 y las amenazas sobre c2.',
    warning: 'Tras 5. Cxe5 Df6 6. d4? Axd4 7. Dxd4, ...Cxc2+ gana la dama por doble ataque.',
    notes: { 8: 'El caballo acepta el sacrificio en lugar del alfil.', 9: 'c3 gana un tiempo y conserva el plan original.', 10: 'La posición coincide con 4...Axb4 5. c3 Ac5.', 14: 'd6 evita las tácticas sobre f7.' },
  },
  {
    id: 'counter', title: 'Contragambito central', subtitle: 'Responder a un sacrificio con otro.',
    notation: '4...d5', kind: 'variant', family: 'other', level: 'Avanzada',
    moves: fromBase('d5 exd5 Nxb4 c3 Nxd5 O-O'), startPly: 8,
    description: 'En vez de mover el alfil, las negras golpean el centro y atacan al alfil blanco de c4.',
    whitePlan: 'exd5 conserva una estructura comprensible. Desarrolla rápido y calcula qué piezas quedan atacadas tras cada intercambio.',
    blackPlan: 'Busca actividad. En esta continuación ilustrativa, ...Cxb4 y ...Cxd5 centralizan el caballo mientras se cambia el centro.',
    warning: 'Es una alternativa aguda, no una forma de evitar el cálculo. Las capturas intermedias importan.',
    notes: { 8: 'd5 contraataca al alfil blanco.', 10: 'El caballo captura b4 mientras el centro permanece abierto.', 12: 'El caballo recaptura en d5.', 13: 'Las blancas priorizan la seguridad del rey.' },
  },
  {
    id: 'cordel', title: 'Variante Cordel', subtitle: 'La gran diagonal contra el gambito rehusado.',
    notation: '4...Ab6 5. Ab2', kind: 'variant', family: 'declined', level: 'Intermedia',
    moves: fromBase('Bb6 Bb2 d6 a4 a6 d3 Nf6'), startPly: 9,
    description: 'Las blancas aprovechan que b2 ha quedado libre para desarrollar el alfil por la gran diagonal.',
    whitePlan: 'Coordina Ab2 con d3 y el enroque. La presión sobre e5 puede aumentar cuando se abra el centro.',
    blackPlan: 'Refuerza e5 con ...d6, crea una salida para tu alfil con ...a6 y desarrolla ...Cf6.',
    warning: 'El alfil de b2 mira e5, pero el centro puede bloquearlo. No bases todo el plan en una diagonal todavía cerrada.',
    notes: { 9: 'Ab2 aprovecha el avance del peón b.', 10: 'd6 refuerza e5.', 13: 'd3 sostiene e4 y consolida el centro.', 14: 'Cf6 completa otra etapa del desarrollo.' },
  },
];

export const traps: Lesson[] = [
  {
    id: 'fork-f7', title: 'El sacrificio en f7', subtitle: 'Un jaque, un doble ataque y un rey expuesto.',
    notation: '8. Axf7+! Rxf7 9. Dd5+', kind: 'trap', family: 'accepted', level: 'Esencial',
    moves: line('Bc5 d4 exd4 O-O dxc3 Bxf7+ Kxf7 Qd5+ Kf8 Qxc5+ d6 Qxc3'), startPly: 14,
    description: 'Con el alfil negro en c5, ...dxc3 permite Axf7+, que atrae al rey, y Dd5+, que ataca al rey y al alfil a la vez.',
    whitePlan: 'Busca Axf7+ y Dd5+ antes de recuperar c3. Recuperas material con jaques y privas al rey negro del enroque.',
    blackPlan: 'Evita 7...dxc3. La continuación 7...d6 8. cxd4 Ab6 lleva a un esquema más sano.',
    warning: 'El detalle decisivo es el alfil en c5. No traslades la combinación automáticamente a la línea con ...Aa5.',
    defenseMoves: line('Bc5 d4 exd4 O-O d6 cxd4 Bb6'),
    notes: { 14: 'dxc3 permite la combinación sobre f7.', 15: 'Axf7+ atrae al rey.', 17: 'Dd5+ da jaque y ataca al alfil de c5.', 19: 'Dxc5+ recupera la pieza con jaque.', 21: 'Dxc3 recupera parte del material. Las negras conservan un peón extra, pero han perdido el enroque y van por detrás en desarrollo.' },
    source: 'https://thechessworld.com/articles/openings/evans-gambit-complete-opening-guide/',
  },
  {
    id: 'knight-fork', title: 'El falso peón gratis', subtitle: 'Una celada que deben conocer las blancas.',
    defendingSide: 'white',
    notation: '4...Cxb4 5. Cxe5?!', kind: 'trap', family: 'other', level: 'Intermedia',
    moves: fromBase('Nxb4 Nxe5 Qf6 d4 Bxd4 Qxd4 Nxc2+'), startPly: 10,
    description: 'Capturar e5 prematuramente permite amenazas con la dama. Tras d4 y Axd4, recuperar con la dama cae en un doble ataque.',
    whitePlan: 'Sigue el plan del gambito: 5. c3 expulsa al caballo y prepara d4. No recuperes el peón a costa de tu desarrollo.',
    blackPlan: '5...Df6 ataca el caballo. Si sigue 6. d4? Axd4 7. Dxd4, ...Cxc2+ gana la dama.',
    warning: 'El jaque en c2 ataca también a la dama de d4 y a la torre de a1. El rey debe responder primero.',
    defenseMoves: fromBase('Nxb4 c3 Nc6 d4 exd4 O-O d6'),
    notes: { 10: 'Df6 amenaza al caballo y presiona f2.', 11: 'd4? permite una secuencia favorable a las negras.', 13: 'La dama entra en d4, al alcance del caballo.', 14: 'Cxc2+ ataca rey, dama y torre. Las negras ganan la dama.' },
    source: 'https://chess.stackexchange.com/questions/1872/how-should-white-continue-after-nxb4-in-the-evans-gambit',
  },
  {
    id: 'pin', title: 'La clavada de c3', subtitle: 'Antes de recuperar, protege a tu rey.',
    defendingSide: 'white', orderTrap: true,
    notation: '5...Aa5 6. d4 exd4', kind: 'trap', family: 'accepted', level: 'Esencial',
    moves: line('Ba5 d4 exd4 O-O d6 cxd4'), startPly: 12,
    description: 'El alfil de a5 apunta al rey de e1 a través de c3. Después de d4, mover el peón de c3 dejaría al rey en jaque.',
    whitePlan: 'Juega 7. O-O. El rey sale de e1, la clavada desaparece y cxd4 vuelve a ser legal.',
    blackPlan: 'Aa5 retrasa la recuperación del peón. Usa ese tiempo para desarrollar, no para capturar sin calcular.',
    warning: 'Es un motivo táctico, no una celada de mate. 7. cxd4 sería ilegal; el tablero no permite realizarla.',
    notes: { 12: 'Selecciona el peón de c3: d4 no es un destino legal.', 13: 'El enroque elimina la clavada.', 15: 'Ahora cxd4 sí es legal. El orden de jugadas lo cambia todo.' },
  },
  {
    id: 'poisoned-rook', title: 'La torre envenenada', subtitle: 'Una torre que cuesta más de lo que vale.',
    notation: '9...Df6? 10. dxc6 Dxa1?', kind: 'trap', family: 'accepted', level: 'Avanzada',
    moves: line('Bc5 d4 exd4 O-O d6 cxd4 Bb6 d5 Qf6 dxc6 Qxa1 Bxf7+ Kxf7 Qb3+ Be6 Ng5+ Ke7 Qxe6+ Kf8 Qf7#'), startPly: 20,
    description: 'La dama negra abandona a su rey para capturar a1. En esta continuación, las blancas encadenan jaques hasta el mate.',
    whitePlan: 'Activa la diagonal con Axf7+ y Db3+. Cg5+ incorpora la última pieza; calcula todas las defensas, no solo la mostrada.',
    blackPlan: 'Evita la excursión de la dama. Ante 9. d5, ...Ca5 conserva contrajuego y ataca al alfil de c4.',
    warning: 'La secuencia ilustra una respuesta concreta. No todas las defensas llevan al mismo mate, pero aceptar la torre es muy peligroso.',
    defenseMoves: line('Bc5 d4 exd4 O-O d6 cxd4 Bb6 d5 Na5 Nc3 Nxc4 Qa4+ Bd7 Qxc4'),
    notes: { 18: 'Df6 descuida el caballo de c6.', 20: 'La dama gana una torre, pero deja de defender al rey.', 21: 'Axf7+ inicia los jaques.', 23: 'Db3+ activa la gran diagonal.', 25: 'Cg5+ añade el caballo al ataque.', 27: 'Dxe6+ elimina al defensor.', 29: 'Df7 es mate. El caballo de g5 protege a la dama.' },
    source: 'https://chessterra.com/2021/10/09/poisoned-rook-trap-evans-gambit/',
  },
];

export const games: Lesson[] = [
  {
    id: 'evergreen', title: 'Anderssen vs. Dufresne', subtitle: 'La Siempreviva · Berlín, 1852',
    notation: '1-0 · 24 jugadas', kind: 'game', family: 'accepted', level: 'Avanzada', startPly: 7,
    moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O d3 Qb3 Qf6 e5 Qg6 Re1 Nge7 Ba3 b5 Qxb5 Rb8 Qa4 Bb6 Nbd2 Bb7 Ne4 Qf5 Bxd3 Qh5 Nf6+ gxf6 exf6 Rg8 Rad1 Qxf3 Rxe7+ Nxe7 Qxd7+ Kxd7 Bf5+ Ke8 Bd7+ Kf8 Bxe7#'.split(' '),
    description: 'Una obra de la era romántica. Anderssen transforma el desarrollo y las diagonales abiertas en un ataque memorable.',
    whitePlan: 'Observa las torres en las columnas centrales y cómo Aa3 limita al rey. El remate funciona porque todas las piezas están coordinadas.',
    blackPlan: 'Mira las amenazas rivales antes de capturar. Esta partida ilustra el riesgo de mantener al rey en el centro y aceptar material bajo ataque.',
    warning: 'Una partida histórica no es una variante forzada. Las negras tuvieron mejoras; estudia los patrones, no una promesa de victoria.',
    notes: { 19: 'Te1 ocupa la columna del rey negro.', 21: 'Aa3 dificulta el enroque.', 33: 'Cf6+ abre líneas hacia el rey.', 37: 'Tad1 incorpora la última torre.', 39: 'Txe7+ inicia la combinación final.', 41: 'Dxd7+ sacrifica la dama para atraer al rey.', 47: 'Axe7 es mate: los dos alfiles culminan el ataque.' },
    source: 'https://jhlywa.github.io/chess.js/',
    players: { white: 'Adolf Anderssen', black: 'Jean Dufresne' }, result: '1-0', year: 1852,
  },
  {
    id: 'fischer-fine', title: 'Fischer vs. Fine', subtitle: 'Una lección de iniciativa · Nueva York, 1963',
    notation: '1-0 · 17 jugadas', kind: 'game', family: 'accepted', level: 'Intermedia', startPly: 7,
    moves: line('Ba5 d4 exd4 O-O dxc3 Qb3 Qe7 Nxc3 Nf6 Nd5 Nxd5 exd5 Ne5 Nxe5 Qxe5 Bb2 Qg5 h4 Qxh4 Bxg7 Rg8 Rfe1+ Kd8 Qg3'),
    description: 'Fischer mantiene la iniciativa con amenazas continuas. Los cambios abren diagonales a sus alfiles y una columna a la torre.',
    whitePlan: 'Fíjate en Cd5, Ab2 y h4: cada jugada activa una pieza u obliga a la dama negra a responder.',
    blackPlan: 'La seguridad del rey vale más que un peón. ...Cf6 permitió Cd5; capturar h4 aumentó la exposición.',
    warning: 'Fine abandonó tras 17. Dg3. La partida no terminó en mate sobre el tablero; 17...Dxg3 permitiría 18. Af6#.',
    notes: { 18: 'Cf6 permite Cd5 con amenaza a la dama.', 19: 'Cd5 aprovecha la ventaja de desarrollo.', 25: 'Ab2 se desarrolla con ganancia de tiempo.', 27: 'h4 vuelve a atacar la dama.', 31: 'Tfe1 coloca la torre frente al rey.', 33: 'Dg3! Fine abandonó. Si ...Dxg3, Af6 sería mate.' },
    source: 'https://www.chessgames.com/perl/chessgame?gid=1043992',
    players: { white: 'Bobby Fischer', black: 'Reuben Fine' }, result: '1-0', year: 1963,
  },
];

export interface Exercise {
  id: string; title: string; prompt: string; moves: string[];
  answer: string; hint: string; explanation: string;
  topic: 'opening' | 'defense' | 'trap';
}
export const exercises: Exercise[] = [
  { id: 'offer', topic: 'opening', title: 'El primer paso', prompt: '¿Cómo comienza el gambito Evans? Desvía el alfil para ganar tiempos en el centro.', moves: BASE.slice(0, 6), answer: 'b4', hint: 'El peón de b2 puede atacar al alfil de c5.', explanation: 'b4! ofrece un peón para desviar el alfil. La idea es continuar con c3 y d4.' },
  { id: 'tempo', topic: 'opening', title: 'Desarrollar con una amenaza', prompt: 'Ataca al alfil y prepara d4 en una sola jugada.', moves: [...BASE, 'Bxb4'], answer: 'c3', hint: 'El peón de c2 puede cumplir dos funciones a la vez.', explanation: 'c3 gana un tiempo y sostiene el futuro centro con d4.' },
  { id: 'safe-bishop', topic: 'defense', title: 'La retirada moderna', prompt: 'Juegas con negras. Lleva el alfil a e7, donde no bloqueará el peón de d7.', moves: accepted, answer: 'Be7', hint: 'El alfil puede retroceder por la diagonal c5-d6-e7.', explanation: 'Ae7 evita ataques de los peones centrales y prepara el desarrollo.' },
  { id: 'castle', topic: 'trap', title: 'Romper la clavada', prompt: 'Tu peón de c3 está clavado. ¿Cómo pones al rey a salvo antes de recuperar en d4?', moves: line('Ba5 d4 exd4'), answer: 'O-O', hint: 'Mueve el rey de e1 a g1 para enrocar.', explanation: 'O-O! saca al rey de la diagonal a5-e1. Ahora cxd4 vuelve a ser legal.' },
  { id: 'solid', topic: 'defense', title: 'Defender como Lasker', prompt: 'Juegas con negras. Sostén e5 con un peón sin abrir todavía el centro.', moves: line('Ba5 d4'), answer: 'd6', hint: 'El peón de d7 puede proteger e5 desde d6.', explanation: 'd6 sostiene el centro y prepara ...Ab6. Devolver material a tiempo es parte de una buena defensa.' },
  { id: 'sacrifice', topic: 'trap', title: 'El punto débil: f7', prompt: 'Encuentra el sacrificio con jaque que prepara Dd5+.', moves: line('Bc5 d4 exd4 O-O dxc3'), answer: 'Bxf7+', hint: 'El alfil de c4 puede capturar el peón que solo defiende el rey.', explanation: 'Axf7+! Rxf7 Dd5+ ataca al rey y al alfil. Recuperas material y eliminas el enroque.' },
  { id: 'triple', topic: 'trap', title: 'Tres amenazas, una jugada', prompt: 'Juegas con negras. Encuentra el jaque de caballo que también ataca a la dama.', moves: fromBase('Nxb4 Nxe5 Qf6 d4 Bxd4 Qxd4'), answer: 'Nxc2+', hint: 'El caballo de b4 tiene una captura con jaque en c2.', explanation: 'Cxc2+! ataca al rey de e1, a la dama de d4 y a la torre de a1.' },
  { id: 'mieses-break', topic: 'defense', title: 'El contragolpe central', prompt: 'Tu caballo ya está en e7. Juega la ruptura que disputa el centro blanco.', moves: line('Ba5 d4 exd4 O-O Nge7 cxd4'), answer: 'd5', hint: 'El peón de d7 puede avanzar dos casillas.', explanation: 'd5! transforma la defensa en contrajuego. Tras exd5, el caballo de e7 puede recuperar.' },
];

export const allLessons = [...italianLines, ...variants, ...traps, ...games];

// Identificadores estables que usa la interfaz. Los tests comprueban que existen,
// de modo que renombrar una lección falle en CI y no en silencio en la interfaz.
export const LESSON_IDS = {
  main: 'main', lasker: 'lasker', modern: 'modern', declined: 'declined', compromised: 'compromised',
} as const;

export function lessonById(id: string): Lesson {
  return allLessons.find((lesson) => lesson.id === id) ?? allLessons[0];
}

// Lecciones que la interfaz referencia por identificador, nunca por posición en el array.
export const MAIN_LINE = lessonById(LESSON_IDS.main);
export const LASKER = lessonById(LESSON_IDS.lasker);
export const MODERN = lessonById(LESSON_IDS.modern);
export const DECLINED = lessonById(LESSON_IDS.declined);
export const COMPROMISED = lessonById(LESSON_IDS.compromised);

// Ply de la posición con el centro montado (d4-e4) en la línea principal,
// y de la jugada 5. c3 que gana un tiempo sobre el alfil.
export const CENTRE_PLY = 15;
export const TEMPO_PLY = BASE.length + 2;

/** Índice del primer ejercicio de celadas: el atajo del panel las lleva al tablero. */
export const FIRST_TRAP_EXERCISE = Math.max(0, exercises.findIndex((exercise) => exercise.topic === 'trap'));

// Qualitative "agudeza" meter: how forced and double-edged a line tends to be.
// It is a study aid, not an engine evaluation.
export const sharpness: Record<string, number> = {
  'giuoco-classical': 5, 'giuoco-pianissimo': 2,
  main: 4, lasker: 2, modern: 2, declined: 1, classical: 4, 'stone-ware': 2,
  compromised: 5, anderssen: 5, mieses: 4, tartakower: 4, alapin: 3, knight: 3,
  counter: 4, cordel: 2, 'fork-f7': 5, 'knight-fork': 4, pin: 2, 'poisoned-rook': 5,
  evergreen: 5, 'fischer-fine': 4,
};
const sharpnessNames = ['Sólida', 'Sólida', 'Dinámica', 'Aguda', 'Letal'];
export function sharpnessLabel(value: number): string {
  return sharpnessNames[Math.max(0, Math.min(value - 1, sharpnessNames.length - 1))];
}
export function makeGame(moves: string[], ply = moves.length): Chess {
  const game = new Chess();
  moves.slice(0, ply).forEach((move) => game.move(move));
  return game;
}

// Código ECO dentro de la familia Evans: C52 cuando el alfil se retira a a5
// (gambito aceptado), C51 en el resto (rehusado u otras respuestas).
// El conocimiento vive aquí, con los datos, no en el exportador de PGN.
export function ecoFor(sequence: string[]): string {
  return sequence[9] === 'Ba5' ? 'C52' : 'C51';
}
export function spanishSan(san: string): string {
  return san.replace(/[KQRBN]/g, (piece) => ({ K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' })[piece] || piece);
}
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// The study library is checked against the same legal rules as the board.
export const libraryErrors: string[] = [];
for (const lesson of allLessons) {
  try {
    makeGame(lesson.moves);
    if (lesson.defenseMoves) makeGame(lesson.defenseMoves);
  } catch (error) {
    libraryErrors.push(`${lesson.title}: ${String(error)}`);
  }
}
for (const exercise of exercises) {
  try { makeGame([...exercise.moves, exercise.answer]); }
  catch (error) { libraryErrors.push(`${exercise.title}: ${String(error)}`); }
}

try {
  for (const id of ['poisoned-rook', 'evergreen']) {
    const lesson = allLessons.find((item) => item.id === id)!;
    if (!makeGame(lesson.moves).isCheckmate()) libraryErrors.push(`${lesson.title}: el remate debe ser mate.`);
  }
  const pinned = makeGame(line('Ba5 d4 exd4'));
  if (pinned.moves().includes('cxd4')) libraryErrors.push('La clavada de c3: la recaptura no debe ser legal.');
  pinned.move('O-O');
  pinned.move('d6');
  if (!pinned.moves().includes('cxd4')) libraryErrors.push('La clavada de c3: el enroque debe permitir la recaptura.');
  if (!makeGame([...games[1].moves, 'Qxg3', 'Bf6#']).isCheckmate()) libraryErrors.push('Fischer vs. Fine: la amenaza final debe ser mate.');
} catch (error) { libraryErrors.push(`Comprobación táctica: ${String(error)}`); }