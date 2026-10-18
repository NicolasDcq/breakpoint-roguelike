import json, sys, collections as C
recs = [json.loads(l) for f in sys.argv[1:] for l in open(f)]
err = [r for r in recs if 'error' in r]; stuck = [r for r in recs if r.get('stuck')]
recs = [r for r in recs if 'error' not in r]
print(f'{len(recs)} parties, {len(err)} erreurs moteur, {len(stuck)} parties bloquées')
for r in err[:3]: print('  ERREUR', r['company'], r['level'], r['seed'], r['error'][:200])
for r in stuck[:3]: print('  BLOQUÉ', r['company'], r['level'], r['seed'], r['stuck'])
print('\n== Victoires par entreprise et difficulté (contrats moyens réussis /24)')
by = C.defaultdict(list)
for r in recs: by[(r['level'], r['company'])].append(r)
levels = sorted({r['level'] for r in recs}); comps = list(dict.fromkeys(r['company'] for r in recs))
print('entreprise'.ljust(10), *[f'niv {l}'.rjust(14) for l in levels])
for c in comps:
    row = []
    for l in levels:
        g = by[(l, c)]
        if not g: row.append(''.rjust(14)); continue
        w = sum(r['phase'] == 'victory' for r in g) / len(g); m = sum(r['reached'] for r in g) / len(g)
        row.append(f'{w*100:4.0f} % ({m:4.1f})'.rjust(14))
    print(c.ljust(10), *row)
for l in levels:
    g = [r for r in recs if r['level'] == l]
    print(f'Total niv {l} : {sum(r["phase"]=="victory" for r in g)/len(g)*100:.0f} % de victoires sur {len(g)} parties')
print('\n== Où les parties s’arrêtent (contrat raté)')
for l in levels:
    d = C.Counter(r['reached'] + 1 for r in recs if r['level'] == l and r['phase'] == 'defeat')
    print(f'niv {l} :', ' '.join(f'c{k}:{v}' for k, v in sorted(d.items())))
def table(title, off_c, take_c, top=10, minoff=8):
    print(f'\n== {title}')
    rows = sorted(((take_c.get(k,0)/o, k, o, take_c.get(k,0)) for k, o in off_c.items() if o >= minoff), reverse=True)
    for rate, k, o, t in rows[:top]: print(f'  {k:14s} pris {t:4d}/{o:4d} = {rate*100:3.0f} %')
    print('  …les moins pris :')
    for rate, k, o, t in rows[-6:]: print(f'  {k:14s} pris {t:4d}/{o:4d} = {rate*100:3.0f} %')
so, st = C.Counter(), C.Counter()
for r in recs:
    for d in r['starterOffered']: so[d] += 1
    st[r['starter']] += 1
table('Premier Plugin', so, st)
bo, bt = C.Counter(), C.Counter()
for r in recs:
    for k, v in r['boxOffered'].items(): bo[k] += v
    for k, v in r['boxTaken'].items(): bt[k] += v
table('Colis', bo, bt)
print('\n== Plugins en fin de partie et victoire (niv le plus haut)')
L = max(levels); g = [r for r in recs if r['level'] == L]; base = sum(r['phase'] == 'victory' for r in g) / len(g)
pc, pw = C.Counter(), C.Counter()
for r in g:
    for p in set(r['plugins']): pc[p] += 1; pw[p] += r['phase'] == 'victory'
rows = sorted(((pw[p]/pc[p], p, pc[p]) for p in pc if pc[p] >= 6), reverse=True)
print(f'  base niv {L} : {base*100:.0f} %')
for w, p, n in rows[:8]: print(f'  {p:14s} {w*100:3.0f} % sur {n}')
print('  …')
for w, p, n in rows[-5:]: print(f'  {p:14s} {w*100:3.0f} % sur {n}')
print('\n== Achats (moyenne par partie)')
ac = C.Counter()
for r in recs: ac.update(r['actions'])
print(' ', ', '.join(f'{k} {v/len(recs):.1f}' for k, v in ac.most_common()))
print('\n== Familles en fin de partie (part du plateau)')
fc = C.Counter()
for r in recs: fc.update(r['boardFam'])
tot = sum(fc.values()); print(' ', ', '.join(f'{k} {v/tot*100:.0f} %' for k, v in fc.most_common()))
mc = C.Counter()
for r in recs: mc.update(set(r['modules']))
print('  modules présents en fin (% des parties) :', ', '.join(f'{k} {v/len(recs)*100:.0f}' for k, v in mc.most_common(12)))
srv = sum(1 for r in recs if 'server' in r['modules'] and 'database' in r['modules'])
print(f'  Serveur + Base ensemble : {srv/len(recs)*100:.0f} % des parties')
print(f'  durée moyenne d’une partie : {sum(r["ms"] for r in recs)/len(recs)/1000:.1f} s')
fu = [r.get('fusions') or 0 for r in recs]
hy = C.Counter()
for r in recs: hy.update(r.get('hybrids') or [])
print(f'\n== Fusions : {sum(fu)/len(recs):.2f} par partie ; hybrides en fin : {sum(hy.values())/len(recs):.2f} par partie')
if hy: print('  les plus fréquents :', ', '.join(f'{k} {v}' for k, v in hy.most_common(10)))
