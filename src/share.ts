import { weddingConfig } from "./config"

export const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent([
  `${weddingConfig.couple.groom} & ${weddingConfig.couple.bride} 💛`,
  "ഞങ്ങളുടെ വിവാഹത്തിലേക്ക് സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു.",
  "",
  "വിവാഹം: 24 ജനുവരി 2027, രാവിലെ 8:30–9:30, ഗുരുവായൂർ ക്ഷേത്രം.",
  "വിവാഹ സൽക്കാരം: 26 ജനുവരി 2027, ഉച്ചയ്ക്ക് 2 മണി മുതൽ, രശ്മിവരം, പയ്യോളി.",
  "",
  weddingConfig.siteUrl,
].join("\n"))}`
