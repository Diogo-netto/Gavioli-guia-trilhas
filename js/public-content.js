import {SITE, FIREBASE, FIREBASE_ENABLED} from './site-config.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const MAX_REVIEWS = 12, MAX_CERTS = 10;
const show = (el) => { if(el) el.hidden = false; };
const raw = (v, limit=500) => typeof v === 'string' ? v.trim().slice(0,limit) : '';
const validHttps = (v) => {try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; }catch {return '';}};
const safeContentImage = (v) => {
  const u=validHttps(v); if(!u) return '';
  const host=new URL(u).hostname.toLowerCase();
  return (host==='firebasestorage.googleapis.com' || host==='storage.googleapis.com') ? u : '';
};

function contactLinks() {
  const number = String(SITE.whatsappNumber || '').replace(/\D/g,'');
  const validNumber = /^\d{12,13}$/.test(number) && number !== '5532000000000';
  $$("a[href*='wa.me/'], a[data-wa-message]").forEach(a => {
    if (validNumber) {
      const msg = a.dataset.waMessage || 'Olá, Pedro! Conheci o site Gavioli Guia Trilhas e quero saber mais sobre os roteiros.';
      a.href = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
      a.target = '_blank'; a.rel='noopener noreferrer';
      a.removeAttribute('aria-disabled');
    } else {
      a.href='#contato'; a.setAttribute('aria-disabled','true');
      a.title='Contato em configuração. Informe o WhatsApp do Pedro em js/site-config.js.';
      a.addEventListener('click', e=>{ e.preventDefault(); toast('Contato em configuração. Confirme o WhatsApp do Pedro.'); });
    }
  });
  const instagram = raw(SITE.instagramUsername,80).replace(/^@/,'');
  const validInstagram = /^[A-Za-z0-9._]{1,30}$/.test(instagram);
  $$('[data-instagram-link]').forEach(a=>{
    if(validInstagram){ a.href=`https://www.instagram.com/${encodeURIComponent(instagram)}/`;a.rel='noopener noreferrer';a.target='_blank';a.removeAttribute('aria-disabled'); }
    else {a.href='#contato';a.setAttribute('aria-disabled','true');a.title='Instagram em configuração';a.addEventListener('click',e=>{e.preventDefault();toast('Instagram em configuração.');});}
  });
}
function toast(message){
  const el=$('#v2-toast');if(!el)return;el.textContent=message;el.classList.add('active');
  clearTimeout(window.__gavioliToastTimeout);window.__gavioliToastTimeout=setTimeout(()=>el.classList.remove('active'),3300);
}

function element(tag, className='', text='') {
  const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;
}
function renderReviews(list){
  const target=$('#v2-reviews-grid'); const section=$('#v2-reviews');
  if(!target || !section)return;
  target.replaceChildren();
  const verified=Array.isArray(list)?list.slice(0,MAX_REVIEWS).filter(v=>v && v.consent === true && raw(v.name,90) && raw(v.text,900) && Number.isInteger(v.rating) && v.rating>=1 && v.rating<=5):[];
  verified.forEach(review=>{
    const card=element('article','v2-review-card');
    const stars=element('div','v2-review-stars','★'.repeat(review.rating)+'☆'.repeat(5-review.rating));stars.setAttribute('aria-label',`${review.rating} de 5 estrelas`);
    const quote=element('blockquote','v2-review-quote',`“${raw(review.text,900)}”`);
    const footer=element('div','v2-review-meta');const name=element('strong','',raw(review.name,90));footer.append(name);
    if(review.sourceUrl && validHttps(review.sourceUrl)){
      const a=element('a','','Ver origem');a.href=validHttps(review.sourceUrl);a.target='_blank';a.rel='noopener noreferrer';footer.append(a);
    } else {footer.append(element('span','','Depoimento autorizado pelo cliente'));}
    card.append(stars,quote,footer);target.append(card);
  });
  if(verified.length) show(section);
}
function renderCertificates(list){
  const target=$('#v2-cert-grid'), section=$('#v2-certificates');
  if(!target || !section)return;
  target.replaceChildren();
  const items=Array.isArray(list)
    ? list.slice(0,MAX_CERTS).filter(cert => cert && raw(cert.title,130) && safeContentImage(cert.fileUrl || ''))
    : [];
  items.forEach(cert=>{
    const card=element('article','v2-cert-card');
    const head=element('div','v2-cert-icon');head.innerHTML='<i class="ph ph-certificate" aria-hidden="true"></i>';
    const info=element('div','v2-cert-info');info.append(element('h3','',raw(cert.title,130)));
    const parts=[raw(cert.issuer,110),raw(cert.year,10)].filter(Boolean).join(' • ');
    if(parts)info.append(element('p','',parts));
    const link=element('a','v2-cert-link','Visualizar documento ↗');link.href=validHttps(cert.fileUrl);link.target='_blank';link.rel='noopener noreferrer';
    card.append(head,info,link);target.append(card);
  });
  if(items.length)show(section);
}
function photos(slots){
  if(!slots || typeof slots!=='object'||Array.isArray(slots))return;
  $$('img[data-photo-slot]').forEach(img=>{
    const uri=safeContentImage(slots[img.dataset.photoSlot]);
    if(uri){img.src=uri;img.addEventListener('error',()=>{if(img.dataset.v2Fallback!=='done') { img.dataset.v2Fallback='done';img.src=img.dataset.originalSrc; }},{once:true});}
  });
}
async function loadPublished(){
  if(!FIREBASE_ENABLED)return;
  try {
    const [appMod,fsMod]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
    ]);
    const app=appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE);
    const db=fsMod.getFirestore(app);
    // Um único getDoc por visita. Sem listener permanente e sem varrer coleções.
    const snap=await fsMod.getDoc(fsMod.doc(db,'site','publico'));
    if(snap.exists()){
      const data=snap.data();renderReviews(data.reviews);renderCertificates(data.certificates);photos(data.photoSlots);
    }
  }catch(e){console.warn('Gavioli: conteúdo opcional indisponível; fotos originais preservadas.',e?.code||'');}
}
function shareGallery(){
  const names={ibitipoca:'Ibitipoca',bomjardim:'Bom Jardim',riopreto:'Rio Preto',limaduarte:'Lima Duarte'};
  $$('[data-share-region]').forEach(btn=>btn.addEventListener('click',async()=>{
    const slug=btn.dataset.shareRegion; if(!names[slug])return;
    const targetUrl=new URL(SITE.canonicalUrl||location.href,location.href);
    targetUrl.searchParams.set('regiao',slug);
    const url=targetUrl.href;
    try {
      if(navigator.share)await navigator.share({title:`Gavioli — ${names[slug]}`,url});
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);toast('Link da galeria copiado!');}
      else {const a=element('textarea');a.value=url;document.body.append(a);a.select();document.execCommand('copy');a.remove();toast('Link da galeria copiado!');}
    }catch(e){if(e?.name!=='AbortError')toast('Não foi possível compartilhar agora.');}
  }));
  const slug=new URLSearchParams(location.search).get('regiao');
  if(slug && names[slug]){
    const node=$(`#modal-${slug}`);if(node){setTimeout(()=>{if(typeof window.openModal==='function')window.openModal(node.id);},300);}
  }
}
function connectAnalytics(){
  const id=raw(SITE.gaMeasurementId,25);
  $('#v2-privacy-settings')?.addEventListener('click',()=>{localStorage.removeItem('gavioli-analytics-choice');location.reload();});
  if(!/^G-[A-Z0-9]+$/.test(id))return;
  const banner=$('#v2-consent'); if(!banner)return;
  const choice=localStorage.getItem('gavioli-analytics-choice');
  const start=()=>{
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());window.gtag('config',id,{anonymize_ip:true});
    const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;document.head.append(script);
    document.addEventListener('click',e=>{
      const a=e.target.closest('a');if(!a||!a.href)return;
      if(a.href.includes('wa.me/'))window.gtag('event','click_whatsapp',{destination:a.closest('[data-destination]')?.dataset.destination||'geral'});
      if(a.href.includes('instagram.com/'))window.gtag('event','click_instagram');
    });
    $$('[data-share-region]').forEach(btn=>btn.addEventListener('click',()=>window.gtag('event','share_gallery',{region:btn.dataset.shareRegion})));
  };
  if(choice==='accepted'){start();return;}
  if(choice==='declined')return;
  show(banner);
  $('#v2-consent-accept')?.addEventListener('click',()=>{localStorage.setItem('gavioli-analytics-choice','accepted');banner.hidden=true;start();});
  $('#v2-consent-decline')?.addEventListener('click',()=>{localStorage.setItem('gavioli-analytics-choice','declined');banner.hidden=true;});
}

window.addEventListener('DOMContentLoaded',()=>{
  $$('img[data-photo-slot]').forEach(img=>img.dataset.originalSrc=img.getAttribute('src'));
  contactLinks();shareGallery();connectAnalytics();loadPublished();
  $('#v2-jump-guide')?.addEventListener('click',()=>{document.querySelector('#guia')?.scrollIntoView({behavior:'auto',block:'start'});});
  // No audio autoplay. Small cosmetic feedback only; original bike keyframes untouched.
  const bike=$('#bike-stage');if(bike && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const onScroll=()=>{
      const dist=Math.max(1,bike.offsetHeight-innerHeight), p=Math.max(0,Math.min(1,-bike.getBoundingClientRect().top/dist));
      bike.style.setProperty('--v2-ride',p.toFixed(3));
      bike.style.setProperty('--v2-dust',(Math.max(0,1-Math.abs((p-.46)/.28))*.22).toFixed(3));
    };
    addEventListener('scroll',onScroll,{passive:true});onScroll();
  }
});
