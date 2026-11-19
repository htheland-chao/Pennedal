import Phaser from 'phaser';
import type { KortScene } from '../KortScene';
import { figurTegnkort, LEVENDE, PERSONER } from './figurer';
import { FELT, feltMidte } from '../kort';
import { KARTOTEK, KASSE, LOGBOG, PLANTE, PORT, PRESSE, SPRINGVAND, STIGE, bordflade, reol, tegnRum, trappe } from '../pixel/inde';
import { blegt, halvtTegnet, hash, lavSkygge, linjeretPapir, sne, tegnGrund, tegnTraeskygger, tegnVand, traePladser } from '../pixel/lerred';
import { aande, lukOejne } from '../pixel/liv';
import { BLADE, BROPLANKE, FUGL, KLATTEN, LANTERNE, PIL, PLANKE, SKILT, STOLPE, TALEBOBLE, fyrtaarn, papirtrae, voksen } from '../pixel/sprites';
import { GRENPORT, HALVFUGL, ORDBLAD, STUMMING, TOMORD, VIMS } from '../pixel/viskeskov';
import { DIGTSTEN, EKKO, RIMFOD, granMedSne } from '../pixel/rimbjerg';
import { LAANTE_TRAEER } from '../pixel/laant/traeer';
import { laantGrafik, rundtTrae } from './laant';
import { FODNOTETAL, FRU_FODNOTE, HAEFTE_KORT, TVIVL, UFAERDIGE_KORT } from '../pixel/arkiv';
import { BREV, KRUSEDULLE, POSTSNEGL, hytte } from '../pixel/blaeksoe';
import { BIP, GRUMSEN, LUP, PRINSESSE, SPOR } from '../pixel/halvelande';
import { HALVSAETNING, LILLE_SKYGGE } from '../pixel/sidstesiden';

/**
 * Bygger stedet, når scenen starter: jorden, vandet, træerne, møblerne og alle figurer og ting.
 * Delt ud af KortScene.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
/** Et møbel fra kortet. Fodpunktet bestemmer dybden, så man kan gå bag om det. */
export function moebel(s: KortScene, c: string, tx: number, ty: number, kaelder: boolean) {
  const k = s.kort;
  const saet = (noegle: string, x: number, bund: number) =>
    s.add
      .image(x, bund, noegle)
      .setOrigin(0, 1)
      .setDepth(bund - 1);
  if (c === 'R') saet(s.tekstur(`px-reol-v-${kaelder}`, reol(26, kaelder)), tx * FELT, ty * FELT + 16);
  else if (c === 'r' && k.tegn(tx, ty - 1) !== 'r') saet(s.tekstur(`px-reol-f-${kaelder}`, reol(30, kaelder)), tx * FELT, (ty + 2) * FELT);
  else if (c === 'P') saet(s.tekstur('px-plante', PLANTE), tx * FELT + 3, ty * FELT + 15);
  else if (c === 'k') saet(s.tekstur('px-kasse', KASSE), tx * FELT + 1, ty * FELT + 15);
  else if (c === 'S' || c === 'U') saet(s.tekstur(`px-trappe-${c}`, trappe(c === 'U')), tx * FELT, ty * FELT + 16);
  else if (c === 'D' && k.tegn(tx - 1, ty) !== 'D') {
    let n = 0;
    while (k.tegn(tx + n, ty) === 'D') n++;
    saet(s.tekstur(`px-disk-${n}`, bordflade(n * FELT, 14, '#a07a4a', '#6b4a2b')), tx * FELT, ty * FELT + 16);
  } else if (c === 'B' && k.tegn(tx - 1, ty) !== 'B' && k.tegn(tx, ty - 1) !== 'B') {
    let n = 0;
    while (k.tegn(tx + n, ty) === 'B') n++;
    saet(s.tekstur(`px-bord-${n}`, bordflade(n * FELT, 30, '#b98b5a', '#7a5636')), tx * FELT, (ty + 2) * FELT);
  }
}

/** Jorden, vandet, træerne og tingene fra kortet (stolper, planker, blade, fyrtårne, springvand og møbler). */
export function byggGrund(s: KortScene, tema: string, inde: boolean) {
  // Rimbjerget har graner med sne i stedet for papirtræer.
  const bjerg = tema === 'rimbjerg';
  // Lånte træer (?laant=1): runde træer fra Ninja Adventure i små grupper mellem vores egne papirgraner.
  const laant = laantGrafik() && !bjerg;
  const rund = laant ? rundtTrae : () => false;
  const traeer = [22, 26, 30, 34].map((h, i) => s.tekstur(`px-trae-${bjerg ? 'gran-' : ''}${i}`, bjerg ? granMedSne(h) : papirtrae(h)));
  const rundeTraeer = laant ? LAANTE_TRAEER.map((t, i) => s.tekstur(`px-trae-laant-${i}`, t)) : [];
  s.tekstur('px-klatten', KLATTEN);
  s.tekstur('px-skilt', SKILT);
  s.tekstur('px-blade', BLADE);
  s.tekstur('px-stolpe', STOLPE);
  s.tekstur('px-planke', PLANKE);
  s.tekstur('px-pil', PIL);
  s.tekstur('px-fugl', FUGL);
  s.tekstur('px-boble', TALEBOBLE);
  s.tekstur('px-fyr', fyrtaarn());
  s.tekstur('px-lanterne', LANTERNE);
  s.tekstur('px-skygge', lavSkygge(12));
  s.byggAvatar();

  // Jorden og vandet for dette sted. Indendørs: gulv og vægge.
  const grund0 = inde ? tegnRum(s.kort, tema === 'kaelder' || tema === 'arkiv' ? 'sten' : 'trae') : tegnGrund(s.kort);
  if (!inde)
    tegnTraeskygger(
      grund0,
      s.kort,
      [22, 26, 30, 34].map((h) => Math.round(h * 0.36) * 2 + 1),
      rund,
    );
  const grund =
    tema === 'viskeskov'
      ? blegt(grund0, 0.8)
      : tema === 'rimbjerg'
        ? sne(grund0)
        : tema === 'halve'
          ? halvtTegnet(grund0)
          : tema === 'siden'
            ? linjeretPapir(grund0)
            : grund0;
  s.add
    .image(0, 0, s.tekstur(`px-grund-${tema}`, grund, true))
    .setOrigin(0)
    .setDepth(-100000);
  for (let i = 0; i < 3; i++) s.tekstur(`px-vand-${tema}-${i}`, tegnVand(s.kort, i, tema), true);
  s.vand = s.add.image(0, 0, `px-vand-${tema}-0`).setOrigin(0).setDepth(-99999);

  // Træer, stolper, planker, blade og fyrtårne fra kortet.
  for (let ty = 0; ty < s.kort.hoejde; ty++)
    for (let tx = 0; tx < s.kort.bredde; tx++) {
      const c = s.kort.tegn(tx, ty);
      const a = hash(tx * 7 + 3, ty * 13 + 1);
      const b = hash(tx * 5 + 1, ty * 3 + 7);
      if (c === '#') {
        // Træerne sættes nedenfor ud fra traePladser, så de passer med skyggerne.
      } else if (c === 'p') {
        const y = ty * FELT + 13;
        s.add
          .image(tx * FELT + 8, y, 'px-stolpe')
          .setOrigin(0.5, 1)
          .setDepth(y);
      } else if (c === 'q') {
        const y0 = Math.round(ty * FELT + 6 + b * 4);
        s.planker.push(
          s.add
            .image(Math.round(tx * FELT + 4 + a * 4), y0, 'px-planke')
            .setOrigin(0)
            .setDepth(-99990)
            .setData('y0', y0),
        );
      } else if (c === 'L') {
        s.add
          .image(tx * FELT + 1, ty * FELT + 6, 'px-blade')
          .setOrigin(0)
          .setDepth(-99980);
      } else if (c === 'F') {
        const y = (ty + 1) * FELT - 1;
        s.add
          .image(tx * FELT + 8, y, 'px-fyr')
          .setOrigin(0.5, 1)
          .setDepth(y);
        s.fyrLamper.push({ x: tx * FELT + 8, y: y - 44 });
      } else if (c === 'f' && s.kort.tegn(tx - 1, ty) !== 'f' && s.kort.tegn(tx, ty - 1) !== 'f') {
        const y = (ty + 2) * FELT;
        s.add
          .image(tx * FELT, y, s.tekstur('px-springvand', SPRINGVAND))
          .setOrigin(0, 1)
          .setDepth(y - 1);
      } else if (inde) moebel(s, c, tx, ty, tema === 'kaelder' || tema === 'arkiv');
    }

  for (const t of traePladser(s.kort, rund))
    s.traeBilleder.push(
      s.add
        .image(t.x, t.y, t.rund ? rundeTraeer[t.nr] : traeer[t.nr])
        .setOrigin(0.5, 1)
        .setDepth(t.y),
    );
}

/** Stedets figurer og ting: Klatten, skilte, personer, væsner, broen og alt det andet fra kapitlets objekter. */
export function byggObjekter(s: KortScene) {
  const sted = s.data_.sted;
  for (const o of sted.objekter) {
    if (!o.felt) continue;
    const midte = feltMidte(o.felt);
    const billeder: Phaser.GameObjects.Image[] = [];
    let noegle: string | null = null;
    if (o.form === 'gnom') noegle = 'px-klatten';
    else if (o.form === 'skilt') noegle = 'px-skilt';
    else if (o.form === 'person') noegle = PERSONER[o.id] ? s.tekstur(`px-person-${o.id}`, PERSONER[o.id]) : s.tekstur(`px-person-${o.farve}`, voksen(o.farve));
    else if (o.form === 'skab') noegle = s.tekstur('px-kartotek', KARTOTEK);
    else if (o.form === 'port' || o.form === 'doer') noegle = s.tekstur('px-port', PORT);
    else if (o.form === 'kasse') noegle = s.tekstur('px-kasse', KASSE);
    else if (o.form === 'presse') noegle = s.tekstur('px-presse', PRESSE);
    else if (o.form === 'stige') noegle = s.tekstur('px-stige', STIGE);
    else if (o.form === 'vims') noegle = s.tekstur('px-vims', VIMS);
    else if (o.form === 'tomord') noegle = s.tekstur('px-tomord', TOMORD);
    else if (o.form === 'stumming') noegle = s.tekstur('px-stumming', STUMMING);
    else if (o.form === 'halvfugl') noegle = s.tekstur('px-halvfugl', HALVFUGL);
    else if (o.form === 'ordblad') noegle = s.tekstur('px-ordblad', ORDBLAD);
    else if (o.form === 'grenport') noegle = s.tekstur('px-grenport', GRENPORT);
    else if (o.form === 'rimfod') noegle = s.tekstur('px-rimfod', RIMFOD);
    else if (o.form === 'ekko') noegle = s.tekstur('px-ekko', EKKO);
    else if (o.form === 'digtsten') noegle = s.tekstur('px-digtsten', DIGTSTEN);
    else if (o.form === 'fodnote') noegle = s.tekstur('px-fodnote', FRU_FODNOTE);
    else if (o.form === 'tvivl') noegle = s.tekstur('px-tvivl', TVIVL);
    else if (o.form === 'fodnotetal') noegle = s.tekstur('px-fodnotetal', FODNOTETAL);
    else if (o.form === 'haefte') noegle = s.tekstur('px-haefte', HAEFTE_KORT);
    else if (o.form === 'ufaerdige') noegle = s.tekstur('px-ufaerdige', UFAERDIGE_KORT);
    else if (o.form === 'hytte') noegle = s.tekstur('px-hytte', hytte());
    else if (o.form === 'snegl') noegle = s.tekstur('px-snegl', POSTSNEGL);
    else if (o.form === 'brev') noegle = s.tekstur('px-brev', BREV);
    else if (o.form === 'krusedulle') noegle = s.tekstur('px-krusedulle', KRUSEDULLE);
    else if (o.form === 'fugl') noegle = 'px-fugl';
    else if (o.form === 'prinsesse') noegle = s.tekstur('px-prinsesse', PRINSESSE);
    else if (o.form === 'lup') noegle = s.tekstur('px-lup', LUP);
    else if (o.form === 'grumsen') noegle = s.tekstur('px-grumsen', GRUMSEN);
    else if (o.form === 'bip') noegle = s.tekstur('px-bip', BIP);
    else if (o.form === 'spor') noegle = s.tekstur('px-spor', SPOR);
    else if (o.form === 'halvsaetning') noegle = s.tekstur('px-halvsaetning', HALVSAETNING);
    else if (o.form === 'skygge') noegle = s.tekstur('px-lille-skygge', LILLE_SKYGGE);
    else if (o.form === 'borger') noegle = s.tekstur(`px-person-${o.farve}`, voksen(o.farve, o.lys ? '#3a2a20' : '#6b4a2b'));
    else if (o.form === 'broplanker') {
      // Den færdige bro over floden (kapitel 1): planker fra bred til bred. Bygges planke for planke (saetSkjulte).
      const noeglePlanke = s.tekstur('px-broplanke', BROPLANKE);
      const x0 = (o.felt[0] - 1) * FELT + 4;
      const y0 = (o.felt[1] - 2) * FELT - 2;
      for (let i = 0; i < 13; i++) {
        const y = y0 + i * 4;
        billeder.push(
          s.add
            .image(x0, y, noeglePlanke)
            .setOrigin(0)
            .setDepth(-99985 + i)
            .setData('y0', y)
            .setData('planke', i),
        );
      }
    } else if (o.form === 'bog') {
      // Bogen ligger fladt på disken og tegnes oven på den.
      billeder.push(
        s.add
          .image(o.felt[0] * FELT + 2, o.felt[1] * FELT + 2, s.tekstur('px-logbog', LOGBOG))
          .setOrigin(0)
          .setDepth(o.felt[1] * FELT + 16),
      );
    }
    if (noegle) {
      if (
        [
          'gnom',
          'person',
          'borger',
          'vims',
          'tomord',
          'stumming',
          'fodnote',
          'tvivl',
          'snegl',
          'krusedulle',
          'fugl',
          'prinsesse',
          'lup',
          'grumsen',
          'bip',
          'halvsaetning',
          'skygge',
        ].includes(o.form)
      )
        billeder.push(
          s.add
            .image(midte.x, midte.y, 'px-skygge')
            .setOrigin(0.5, 0.5)
            .setDepth(midte.y - 1),
        );
      const hoved = s.add.image(midte.x, midte.y, noegle).setOrigin(0.5, 1).setDepth(midte.y).setData('y0', midte.y);
      billeder.push(hoved);
      const oejne = LEVENDE[o.form];
      if (oejne) {
        // Lav billeder til at blinke og trække vejret ud fra figurens eget billede.
        const kilde = figurTegnkort(o);
        if (kilde) {
          const lukket = lukOejne(kilde, oejne);
          if (lukket) s.tekstur(`${noegle}-blink`, lukket);
          s.tekstur(`${noegle}-aande`, aande(kilde));
          s.levende.push({ billede: hoved, noegle, fase: hash(o.felt[0] * 3, o.felt[1] * 11) });
        }
      }
    }
    if (o.form === 'ufaerdige' && noegle && !s.data_.mindreUhygge) {
      // Den Ufærdiges blege øjne ses i mørket: de ligger over lyslaget.
      const oejne = { raekker: UFAERDIGE_KORT.raekker.map((r) => r.replace(/[^E]/g, '.')), palet: UFAERDIGE_KORT.palet };
      billeder.push(s.add.image(midte.x, midte.y, s.tekstur('px-ufaerdige-oejne', oejne)).setOrigin(0.5, 1).setDepth(1_000_001));
      // Blækrøg stiger op fra Den Ufærdige (13. november 2026): små mørke fnug, der svæver op og blegner.
      const b = Math.max(...UFAERDIGE_KORT.raekker.map((r) => r.length));
      const h = UFAERDIGE_KORT.raekker.length;
      let n = 0;
      s.time.addEvent({
        delay: 160,
        loop: true,
        callback: () => {
          const figur = billeder[0] as Phaser.GameObjects.Image | undefined;
          if (!figur?.visible) return;
          n++;
          const fx = midte.x + (hash(n, 7) - 0.5) * b * 0.9;
          const fy = midte.y - hash(n, 13) * h * 0.8;
          // Hvert tredje fnug er blegt og ses også i mørket (det ligger over lyslaget som øjnene).
          const bleg = n % 3 === 0;
          const fnug = s.add
            .rectangle(fx, fy, bleg ? 1 : 2, 1, bleg ? 0x9a90d0 : 0x0b0a14)
            .setDepth(bleg ? 1_000_000 : midte.y + 1)
            .setAlpha(bleg ? 0.55 : 0.85);
          s.tweens.add({
            targets: fnug,
            y: fy - 10 - hash(n, 5) * 8,
            x: fx + (hash(n, 3) - 0.5) * 6,
            alpha: 0,
            duration: 1300,
            ease: 'Sine.Out',
            onComplete: () => fnug.destroy(),
          });
        },
      });
    }
    if (o.lys) {
      billeder.push(
        s.add
          .image(midte.x + 7, midte.y - 9, 'px-lanterne')
          .setOrigin(0.5, 1)
          .setDepth(midte.y + 1),
      );
    }
    if (o.snakker) {
      // Byens folk snakker i munden på hinanden: små talebobler, der kommer og går.
      const b = s.add
        .image(midte.x + 4, midte.y - 28, 'px-boble')
        .setOrigin(0.5, 1)
        .setDepth(2_000_000)
        .setVisible(false);
      b.setData('snak', hash(o.felt[0] * 13, o.felt[1] * 7) * 6).setData('id', o.id);
      s.snakkebobler.push(b);
      billeder.push(b);
    }
    s.objektBilleder.set(o.id, billeder);
  }
}
