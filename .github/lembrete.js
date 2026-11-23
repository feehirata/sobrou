// Manda o lembrete do dia. Lê o código colado no secret SOBROU_PUSH (gerado no app, em Ajustes).
const webpush = require('web-push');
const raw = (process.env.SOBROU_PUSH || '').trim();
if (!raw) { console.log('Sem o secret SOBROU_PUSH ainda: nada pra mandar.'); process.exit(0); }
let c;
try { c = JSON.parse(Buffer.from(raw.replace(/\s+/g, ''), 'base64').toString('utf8')); }
catch (e) { console.error('O código no SOBROU_PUSH não está inteiro. Copie de novo no app (Ajustes > Lembrete diário).'); process.exit(1); }
const owner = process.env.GITHUB_REPOSITORY_OWNER || 'sobrou';
webpush.setVapidDetails(`https://${owner.toLowerCase()}.github.io/`, c.pub, c.priv);
const MSGS = [
  'Já lançou os gastos de hoje? Leva 10 segundos.',
  'Passa no Sobrou: o que você gastou hoje?',
  'Hora de anotar o dia. Escreve tipo "32 mercado nubank".',
  'Um minutinho pro Sobrou? Lança o que saiu hoje.',
  'Bora fechar o dia: tem gasto pra lançar?',
];
const day = Math.floor(Date.now() / 864e5);
const payload = JSON.stringify({ title: 'Sobrou', body: MSGS[day % MSGS.length], tag: 'sobrou-lembrete' });
webpush.sendNotification(c.sub, payload, { TTL: 6 * 3600, urgency: 'normal' })
  .then(r => console.log('Lembrete enviado:', r.statusCode))
  .catch(e => {
    if (e.statusCode === 404 || e.statusCode === 410) console.error('O celular não aceita mais esse código. Abra o app, gere o código de novo e troque o secret.');
    else console.error('Falhou:', e.statusCode || '', e.body || e.message);
    process.exit(1);
  });
