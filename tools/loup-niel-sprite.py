#!/usr/bin/env python3
"""Loup Niel · mascotte vectorielle par pièces (viewBox 0 0 200 200).

Usage :
  python3 tools/loup-niel-sprite.py           # écrit les 9 poses dans un dossier loup-niel/ (aperçu)
  python3 tools/loup-niel-sprite.py --module  # affiche un module JS { pose: "<svg…>" } à comparer
                                              # avec src/tutorial/loupNielSprites.js
"""
import json, os, sys

INK='#05070f'; FUR='#8f9bbd'; DARK='#5b6688'; LIGHT='#eef1f8'; PINK='#ff9cc2'; HOOD='#2a3566'; HOOD2='#3a4780'; AMBER='#ffb020'; HAIR='#cfa673'; HAIR2='#a97e4a'; HAIR3='#e6c696'; LENS='#cfe6ff'
S=f'stroke="{INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"'

def ears(mode):
    if mode=='down':
        L=f'<path d="M62 64 L18 58 Q12 58 16 64 L58 92 Z" fill="{DARK}" {S}/><path d="M54 70 L30 64 L52 84 Z" fill="{PINK}"/>'
    else:
        L=f'<path d="M58 72 L44 20 Q46 12 54 16 L96 50 Z" fill="{DARK}" {S}/><path d="M60 62 L52 30 L82 52 Z" fill="{PINK}"/>'
    R=L.replace('<path','<path transform="translate(200,0) scale(-1,1)"')
    return L+R

def body(arm):
    s=f'<path d="M46 202 Q46 150 100 146 Q154 150 154 202 Z" fill="{HOOD}" {S}/>'
    s+=f'<path d="M76 150 Q100 170 124 150" fill="none" stroke="{HOOD2}" stroke-width="5" stroke-linecap="round"/>'
    s+=f'<path d="M88 160 v16 M112 160 v16" stroke="{LIGHT}" stroke-width="4" stroke-linecap="round"/>'
    s+=f'<rect x="124" y="174" width="24" height="13" rx="3" fill="{AMBER}" stroke="{INK}" stroke-width="3"/><text x="136" y="184.5" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="9" fill="{INK}">CTO</text>'
    return s

def head():
    p=("M100 40 Q148 40 160 80 L172 90 L160 100 L172 112 L156 118 Q146 142 100 146 "
       "Q54 142 44 118 L28 112 L40 100 L28 90 L40 80 Q52 40 100 40 Z")
    s=f'<path d="{p}" fill="{FUR}" {S}/>'
    s+=f'<path d="M66 48 Q100 36 134 48 Q122 60 112 64 L100 78 L88 64 Q78 60 66 48 Z" fill="{DARK}"/>'
    s+=f'<path d="M48 104 Q58 96 74 104 Q74 128 100 136 Q126 128 126 104 Q142 96 152 104 Q146 136 100 142 Q54 136 48 104 Z" fill="{LIGHT}"/>'
    s+=f'<ellipse cx="100" cy="116" rx="26" ry="18" fill="{LIGHT}"/>'
    return s

def hair():
    # coupe courte châtain clair, mèches rabattues vers la droite
    d=("M54 64 Q48 36 78 30 Q100 22 124 28 Q152 36 147 64 "
       "Q141 54 130 55 Q124 44 110 49 Q102 39 88 46 Q76 42 66 52 Q58 54 54 64 Z")
    s=f'<path d="{d}" fill="{HAIR}" {S}/>'
    s+=f'<path d="M70 42 Q86 32 104 32" fill="none" stroke="{HAIR3}" stroke-width="5" stroke-linecap="round"/>'
    s+=f'<path d="M88 46 Q96 40 104 41 M110 49 Q118 44 126 46" fill="none" stroke="{HAIR2}" stroke-width="3.5" stroke-linecap="round"/>'
    s+=f'<path d="M116 28 Q126 18 134 24 Q128 24 124 30" fill="{HAIR}" {S}/>'
    return s

def glasses():
    s=''
    for cx in (76,124):
        s+=f'<rect x="{cx-19}" y="68" width="38" height="30" rx="11" fill="{LENS}" fill-opacity=".35" {S}/>'
    s+=f'<path d="M95 80 Q100 76 105 80" fill="none" {S}/>'
    s+=f'<path d="M57 78 L42 74 M143 78 L158 74" {S}/>'
    s+=f'<path d="M62 74 L68 72" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M110 74 L116 72" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
    return s

def eye_at(cx,mode):
    cy=84
    if mode=='open':  return f'<circle cx="{cx}" cy="{cy}" r="7" fill="{INK}"/><circle cx="{cx+2.5}" cy="{cy-2.5}" r="2.4" fill="#fff"/>'
    if mode=='happy': return f'<path d="M{cx-8} {cy+3} Q{cx} {cy-7} {cx+8} {cy+3}" fill="none" {S}/>'
    if mode=='closed':return f'<path d="M{cx-8} {cy} Q{cx} {cy+6} {cx+8} {cy}" fill="none" {S}/>'
    if mode=='wide':  return f'<circle cx="{cx}" cy="{cy}" r="10" fill="#fff" stroke="{INK}" stroke-width="4"/><circle cx="{cx}" cy="{cy}" r="4.5" fill="{INK}"/>'
    if mode=='half':  return f'<path d="M{cx-8} {cy-1} H{cx+8}" {S}/><path d="M{cx-6} {cy+1} Q{cx} {cy+8} {cx+6} {cy+1} Z" fill="{INK}"/>'

def eyes(mode):
    if mode=='wink': return eye_at(76,'open')+eye_at(124,'closed')
    return eye_at(76,mode)+eye_at(124,mode)

def brows(mode):
    B=lambda d: f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    if mode=='flat':  return B('M64 60 Q76 56 88 60')+B('M112 60 Q124 56 136 60')
    if mode=='up':    return B('M64 56 Q76 48 88 56')+B('M112 56 Q124 48 136 56')
    if mode=='one':   return B('M64 60 Q76 56 88 60')+B('M112 52 Q124 42 136 52')
    if mode=='worry': return B('M64 58 Q76 58 88 52')+B('M112 52 Q124 58 136 58')
    if mode=='angry': return B('M64 54 Q76 56 88 62')+B('M112 62 Q124 56 136 54')
    return ''

def nose():
    return f'<path d="M88 102 Q100 96 112 102 Q112 112 100 114 Q88 112 88 102 Z" fill="{INK}"/><ellipse cx="95" cy="102" rx="3.5" ry="2" fill="#fff" opacity=".7"/>'

def mouth(mode):
    stem=f'<path d="M100 114 V120" {S}/>'
    if mode=='smirk': return stem+f'<path d="M86 122 Q93 126 100 120 Q109 128 118 120" fill="none" {S}/>'
    if mode=='smile': return f'<path d="M84 120 Q100 122 116 120 Q114 138 100 138 Q86 138 84 120 Z" fill="#c0283c" {S}/><path d="M92 131 Q100 126 108 131 Q106 136 100 136 Q94 136 92 131 Z" fill="{PINK}"/>'
    if mode=='talk':  return stem+f'<path d="M90 122 Q100 120 110 122 Q108 132 100 132 Q92 132 90 122 Z" fill="#c0283c" {S}/>'
    if mode=='worry': return f'<path d="M86 128 Q93 120 100 126 Q107 120 114 128" fill="none" {S}/>'
    if mode=='o':     return f'<ellipse cx="100" cy="127" rx="7" ry="9" fill="#c0283c" {S}/>'
    if mode=='grr':   return f'<path d="M86 124 H114 V132 H86 Z" fill="#fff" {S}/><path d="M93 124 V132 M100 124 V132 M107 124 V132" stroke="{INK}" stroke-width="2.5"/>'

def paw(x,y,r=12): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{LIGHT}" {S}/>'

def arm(kind):
    if kind=='wave':
        return (f'<path d="M150 186 Q166 168 168 140" fill="none" stroke="{INK}" stroke-width="30" stroke-linecap="round"/>'
                f'<path d="M150 186 Q166 168 168 140" fill="none" stroke="{HOOD}" stroke-width="19" stroke-linecap="round"/>'
                +paw(169,128,14)+f'<path d="M160 118 v-6 M168 116 v-7 M176 118 v-6" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>')
    if kind=='point':  # désigne quelque chose sur le côté
        return (f'<path d="M148 186 Q160 166 176 160" fill="none" stroke="{INK}" stroke-width="30" stroke-linecap="round"/>'
                f'<path d="M148 186 Q160 166 176 160" fill="none" stroke="{HOOD}" stroke-width="19" stroke-linecap="round"/>'
                +paw(180,158,12)+f'<path d="M186 154 H198" stroke="{INK}" stroke-width="12" stroke-linecap="round"/><path d="M186 154 H197" stroke="{LIGHT}" stroke-width="5" stroke-linecap="round"/>')
    if kind=='thumb':
        return (f'<path d="M146 190 Q162 176 164 160" fill="none" stroke="{INK}" stroke-width="30" stroke-linecap="round"/>'
                f'<path d="M146 190 Q162 176 164 160" fill="none" stroke="{HOOD}" stroke-width="19" stroke-linecap="round"/>'
                f'<rect x="148" y="134" width="34" height="28" rx="10" fill="{LIGHT}" {S}/>'
                f'<path d="M150 138 L142 118 Q140 110 148 110 Q154 110 156 118 L162 136" fill="{LIGHT}" {S}/>'
                f'<path d="M164 143 H180 M164 150 H180 M164 157 H178" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
    if kind=='chin':
        return (f'<path d="M130 196 Q140 170 120 150" fill="none" stroke="{INK}" stroke-width="30" stroke-linecap="round"/>'
                f'<path d="M130 196 Q140 170 120 150" fill="none" stroke="{HOOD}" stroke-width="19" stroke-linecap="round"/>'+paw(116,144,13))
    if kind=='coffee':
        return (f'<path d="M150 194 Q160 176 148 162" fill="none" stroke="{INK}" stroke-width="30" stroke-linecap="round"/>'
                f'<path d="M150 194 Q160 176 148 162" fill="none" stroke="{HOOD}" stroke-width="19" stroke-linecap="round"/>'
                f'<path d="M162 152 q10 0 10 9 q0 9 -10 9" fill="none" {S}/><rect x="126" y="140" width="38" height="36" rx="6" fill="#fff" {S}/>'
                f'<text x="145" y="163" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="11" fill="{INK}">CTO</text>'
                f'<path d="M136 134 q-4 -6 0 -12 M146 134 q-4 -6 0 -12 M156 134 q-4 -6 0 -12" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>'
                +paw(122,170,11))
    return ''

def extra(kind):
    if kind=='sweat': return f'<path d="M160 50 Q152 62 156 68 Q162 74 168 68 Q170 62 160 50 Z" fill="#7cd3ff" stroke="{INK}" stroke-width="4"/>'
    if kind=='spark': return f'<path d="M30 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" fill="{AMBER}" stroke="{INK}" stroke-width="3"/><path d="M168 30 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" fill="{AMBER}" stroke="{INK}" stroke-width="3"/>'
    if kind=='alert': return f'<path d="M166 26 L184 58 H148 Z" fill="#ff5a5a" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/><path d="M166 38 v10" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><circle cx="166" cy="53" r="2.4" fill="{INK}"/>'
    return ''

POSES={
 'neutre':   dict(ear='up',eye='open', brow='flat', mouth='smirk'),
 'salut':    dict(ear='up',eye='happy',brow='up',   mouth='smile', arm='wave'),
 'explique': dict(ear='up',eye='open', brow='one',  mouth='talk',  arm='point'),
 'reflechit':dict(ear='up',eye='half', brow='flat', mouth='smirk', arm='chin'),
 'bravo':    dict(ear='up',eye='wink', brow='up',   mouth='smile', arm='thumb', fx='spark'),
 'inquiet':  dict(ear='down',eye='open',brow='worry',mouth='worry', fx='sweat'),
 'surpris':  dict(ear='up',eye='wide', brow='up',   mouth='o'),
 'alerte':   dict(ear='down',eye='wide',brow='angry',mouth='grr',  fx='alert'),
 'cafe':     dict(ear='up',eye='closed',brow='flat',mouth='smirk', arm='coffee'),
}

def svg(name, size=None):
    o=POSES[name]
    parts=[ears(o['ear']), body(o.get('arm')), head(), hair(), glasses(), eyes(o['eye']), brows(o['brow']), nose(), mouth(o['mouth']), arm(o.get('arm')), extra(o.get('fx'))]
    dims=f' width="{size}" height="{size}"' if size else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"{dims}>'+''.join(parts)+'</svg>'

if __name__ == '__main__':
    if '--module' in sys.argv:
        print('export const LOUP_SVG = ' + json.dumps({k: svg(k) for k in POSES}, indent=2, ensure_ascii=False) + ';')
    else:
        os.makedirs('loup-niel', exist_ok=True)
        for k in POSES:
            open(f'loup-niel/{k}.svg', 'w').write(svg(k, 200))
        print('9 poses écrites dans loup-niel/')
