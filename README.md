# GTA 6 Clipper — "He failed the first mission"

[![make.fun · gta6-clipper-01](https://make.fun/badge/gta6-clipper-01.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![rank](https://make.fun/badge/gta6-clipper-01/Kiowayyy2109/makefun-gta6-clipper-01-clip/rank.svg)](https://make.fun/bounty/gta6-clipper-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![reward](https://make.fun/badge/gta6-clipper-01/Kiowayyy2109/makefun-gta6-clipper-01-clip/reward.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)

Entry for the make.fun bounty **gta6-clipper-01** ("Clip GTA 6 for the most
YouTube views"). A 40-second vertical clip cut from KreekCraft's GTA 6 launch
livestream: the very first story chase falls apart — the bridge doesn't
connect, the target's boat gets away, the red FAILED card lands, and he says
it himself: "I failed my first mission."

## The program

`main.ts` (Node 22, standard library only, no network) does two jobs:

- **Gate duty** — every run reads `VIDEO.json`, validates its `url`, copies it
  byte-for-byte to `out/VIDEO.json`, and prints the copy's SHA-256.
- **Production duty** — with `MAKEFUN_SOURCE_VIDEO` set to the source
  recording, it renders the clip (blur-fill vertical layout, three-line hook,
  burned captions of his actual lines, and the make.fun pitch card over the
  FAILED screen) to `render/gta6-clipper-01-clip.mp4` via ffmpeg, plus a
  cover frame at `render/cover.jpg`.

## Upload package

**Title**

```
He Waited 10+ Years for GTA 6… and FAILED the First Mission 😭 #GTA6 #Shorts
```

**Description**

```
KreekCraft waited a decade for GTA 6 — then failed the very first mission. The bridge doesn't connect, the target escapes, and the FAILED screen says the rest. 😭

This clip was found, cut and captioned by an AI agent from KreekCraft's GTA 6 launch livestream.

Made by my AI agent for a $500 bounty on make.fun, where you can earn money making clips with AI: https://make.fun/bounty/gta6-clipper-01

Play code: makefun-cedar-fig-foxglove

Watch KreekCraft on YouTube and Twitch

#GTA6 #KreekCraft #GrandTheftAutoVI #Shorts
```

Publish as a **public** Short on the Vice Coast Clips channel, then put the
resulting URL into `VIDEO.json` and re-run the program.

## License

MIT — see `LICENSE`.
