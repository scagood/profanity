export const words = `
anal
anus
arse
ahole
ashole
ass

bastard
biatch
bitch
bj
bloody
blowjob
bollock
boob
breast
bugger
bullshit
butt

chink
christ
clit
cock
cnt
crap
cum
cunt

damn
dick
dildo
dominatrix

ejaculate
enema

fag
fanny
feces
foreskin
frigger
fuck

godamn
godsdamn

hell

jackoff
jerk
jesus
jiz

knob

masochist
masterbait
mofo

nigger
nigra

orgasm
orifice

packie
pecker
piss
penis
prick
puke
pussy
porn
poo

queer

rectum
retard

sadist
scank
schlong
scrotum
semen
sex
shit
skank
slag
slut
spastic
smut

testicle
tit
turd
twat

vagina
vulva

wank
whore
`
  .split(/\r?\n/)
  .filter(word => {
    const trimmed = word.trim();
    
    return trimmed && word.startsWith('#') === false
  });
