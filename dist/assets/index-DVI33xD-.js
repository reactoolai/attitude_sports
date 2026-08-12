(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const c of t)if(c.type==="childList")for(const h of c.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&i(h)}).observe(document,{childList:!0,subtree:!0});function a(t){const c={};return t.integrity&&(c.integrity=t.integrity),t.referrerPolicy&&(c.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?c.credentials="include":t.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function i(t){if(t.ep)return;t.ep=!0;const c=a(t);fetch(t.href,c)}})();const E={K:"#16161A",O:"#FF5A1F",G:"#9C9CA4",W:"#F2F0EB"},{K:r,O:l,G:u,W:d}=E,C={hommes:{label:"Hommes",sub:"Entraînement, course et mode de vie — bâti pour la performance.",cats:["T-shirts","Chandails à capuchon","Shorts","Pantalons","Accessoires"],sizes:["XS","S","M","L","XL","2XL","3XL"]},femmes:{label:"Femmes",sub:"Du studio à la rue : leggings, brassières, vestes et plus.",cats:["Leggings","Brassières","T-shirts","Chandails","Accessoires"],sizes:["XS","S","M","L","XL","2XL"]},enfants:{label:"Enfants",sub:"Pour bouger, grandir et tout donner.",cats:["Garçons","Filles","Vêtements d'équipe","Accessoires"],sizes:["XS (5-6)","S (7-8)","M (10-12)","L (14-16)","XL (18-20)"]},chaussures:{label:"Chaussures",sub:"Course, entraînement, basketball — trouve ta pointure.",cats:["Course","Entraînement","Basketball","Mode de vie"],sizes:["7","7.5","8","8.5","9","9.5","10","10.5","11","12","13"]},outlet:{label:"Outlet",sub:"Jusqu'à 50 % de rabais sur une sélection d'articles. Quantités limitées.",cats:["Hommes","Femmes","Enfants","Chaussures"],sizes:["XS","S","M","L","XL","2XL"]}},b=[{name:"T-shirt AS-Dry Performance",cat:"Entraînement",colors:4,price:"34,99 $",n:34.99,oldPrice:"",badge:"Nouveau",d:["hommes"],rating:"4.7",reviews:128,dots:[r,d,l]},{name:"Débardeur Cadence",cat:"Course",colors:3,price:"29,99 $",n:29.99,oldPrice:"",badge:"",d:["hommes"],rating:"4.5",reviews:64,dots:[r,u]},{name:"Manches longues Thermo",cat:"Entraînement",colors:2,price:"44,99 $",n:44.99,oldPrice:"",badge:"",d:["hommes"],rating:"4.6",reviews:87,dots:[r,"#2E2E34"]},{name:"Chandail à capuchon Fortitude",cat:"Mode de vie",colors:5,price:"79,99 $",n:79.99,oldPrice:"",badge:"Nouveau",d:["hommes","femmes"],rating:"4.8",reviews:214,dots:[r,u,l,d]},{name:"T-shirt graphique AS",cat:"Mode de vie",colors:3,price:"24,99 $",n:24.99,oldPrice:"32,99 $",badge:"Solde",d:["hommes","outlet"],rating:"4.4",reviews:96,dots:[r,d,l]},{name:"Polo Précision",cat:"Golf",colors:2,price:"54,99 $",n:54.99,oldPrice:"",badge:"",d:["hommes"],rating:"4.6",reviews:41,dots:[r,d]},{name:"Legging Momentum 7/8",cat:"Course",colors:4,price:"64,99 $",n:64.99,oldPrice:"",badge:"Nouveau",d:["femmes"],rating:"4.9",reviews:302,dots:[r,u,l]},{name:"Brassière Impulsion",cat:"Entraînement",colors:3,price:"39,99 $",n:39.99,oldPrice:"",badge:"",d:["femmes"],rating:"4.7",reviews:156,dots:[r,d,l]},{name:"Short Élan 2-en-1",cat:"Course",colors:2,price:"49,99 $",n:49.99,oldPrice:"59,99 $",badge:"Solde",d:["femmes","outlet"],rating:"4.5",reviews:73,dots:[r,u]},{name:"Veste Tempo",cat:"Course",colors:2,price:"89,99 $",n:89.99,oldPrice:"",badge:"",d:["femmes"],rating:"4.8",reviews:58,dots:[r,l]},{name:"T-shirt Mini Attitude",cat:"Mode de vie",colors:3,price:"19,99 $",n:19.99,oldPrice:"",badge:"",d:["enfants"],rating:"4.6",reviews:44,dots:[r,l,d]},{name:"Ensemble molleton Junior",cat:"Mode de vie",colors:2,price:"59,99 $",n:59.99,oldPrice:"74,99 $",badge:"Solde",d:["enfants","outlet"],rating:"4.7",reviews:39,dots:[r,u]},{name:"Short d'équipe Junior",cat:"Entraînement",colors:4,price:"24,99 $",n:24.99,oldPrice:"",badge:"Nouveau",d:["enfants"],rating:"4.5",reviews:27,dots:[r,u,l,d]},{name:"Chaussure Vitesse 3",cat:"Course",colors:3,price:"129,99 $",n:129.99,oldPrice:"",badge:"Nouveau",d:["chaussures","hommes"],rating:"4.8",reviews:187,dots:[r,d,l]},{name:"Chaussure Fondation TR",cat:"Entraînement",colors:2,price:"109,99 $",n:109.99,oldPrice:"",badge:"",d:["chaussures"],rating:"4.6",reviews:92,dots:[r,u]},{name:"Chaussure Verdict Court",cat:"Basketball",colors:2,price:"139,99 $",n:139.99,oldPrice:"169,99 $",badge:"Solde",d:["chaussures","outlet"],rating:"4.7",reviews:115,dots:[r,l]}],P=["Ajustée","Régulière","Ample"],T=["AS-Dry","Thermo","Sans coutures","Anti-odeur"],L=["20 % et plus","30 % et plus","50 % et plus"],F=["4 étoiles et plus","3 étoiles et plus"],y=b.filter(e=>["T-shirt AS-Dry Performance","Legging Momentum 7/8","Chandail à capuchon Fortitude","Chaussure Vitesse 3"].includes(e.name)),k=[{t:"Livraison gratuite à partir de 150 $",d:"Partout au Canada, en 2 à 5 jours ouvrables."},{t:"Retours sous 60 jours",d:"En ligne ou en boutique, sans tracas."},{t:"Conseils d'experts",d:"Notre équipe pratique ce qu'elle vend."}],q=[{t:"Magasiner",links:["Hommes","Femmes","Enfants","Chaussures","Outlet"]},{t:"Aide",links:["Suivi de commande","Livraison","Retours et échanges","Guide des tailles","Nous joindre"]},{t:"À propos",links:["Notre histoire","Nos boutiques","Carrières","Programme équipes"]},{t:"Suivez-nous",links:["Instagram","Facebook","TikTok","YouTube"]}],S=document.getElementById("app"),n={sort:"featured",q:""},j=()=>'<div class="promo">Livraison gratuite à partir de 150 $ &nbsp;·&nbsp; Retours faciles en magasin</div>',M=()=>`
<header class="header">
  <a href="#/" class="logo"><img src="/logo.png" alt="Attitude Sports"></a>
  <nav class="nav">
    <a href="#/hommes">Hommes</a>
    <a href="#/femmes">Femmes</a>
    <a href="#/enfants">Enfants</a>
    <a href="#/chaussures">Chaussures</a>
    <a href="#/outlet" class="outlet">Outlet</a>
  </nav>
  <div class="header-right">
    <div class="search"><span>⌕</span><input id="search-input" value="${n.q}" placeholder="Rechercher"></div>
    <a href="#" class="icon" aria-label="Compte" title="Se connecter">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>
    </a>
    <a href="#" class="icon cart" aria-label="Panier" title="Panier">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4.5 7.5h15l-1.3 11h-12.4z"/><path d="M8.8 7.5a3.2 3.2 0 0 1 6.4 0"/></svg>
      <span class="cart-badge">2</span>
    </a>
  </div>
</header>`,w=(e,s="")=>`<div class="ph ${s}"><span>[ ${e} ]</span></div>`,o=["/images/im1_(1).png","/images/im2_(1).png","/images/im3_(1).png","/images/im4.png","/images/im5.png"],N=()=>{const e=[[o[0],o[1],o[2]],[o[3],o[4],o[0]],[o[1],o[2],o[3]],[o[4],o[0],o[1]],[o[2],o[3],o[4]]];return`
  <div class="hero-gallery" aria-hidden="true">
    ${[0,1,2].map(s=>`
      <div class="hero-slot">
        ${e.map((a,i)=>`<img class="hero-img${i===0?" active":""}" src="${a[s]}" alt="" loading="${i<3?"eager":"lazy"}">`).join("")}
      </div>
    `).join("")}
  </div>`},v=(e,s=!0)=>`
<a href="#/produit" class="card">
  <div class="card-img ${s?"":"sm"}">
    <span class="ph-label">[ photo produit ]</span>
    ${e.badge?`<span class="badge ${e.badge==="Nouveau"?"orange":""}">${e.badge}</span>`:""}
  </div>
  <div class="card-body">
    <div class="dots">${e.dots.map(a=>`<span style="background:${a}"></span>`).join("")}<em>${e.colors} couleurs</em></div>
    <div class="card-name">${e.name}</div>
    <div class="card-cat">${e.cat}</div>
    <div class="card-price">
      ${e.oldPrice?`<span class="sale">${e.price}</span><span class="old">${e.oldPrice}</span>`:`<span>${e.price}</span>`}
    </div>
    <div class="card-rating"><span>★</span> ${e.rating} (${e.reviews} avis)</div>
  </div>
</a>`,O=()=>`
<footer class="footer">
  <div class="footer-news">
    <div>
      <div class="footer-news-title">Rejoins l'équipe</div>
      <div class="footer-news-sub">Offres exclusives, nouveautés et 10 % sur ta première commande.</div>
    </div>
    <form class="news-form" onsubmit="return false">
      <input type="email" placeholder="Adresse courriel">
      <button>S'abonner</button>
    </form>
  </div>
  <div class="footer-cols">
    ${q.map(e=>`
      <div>
        <div class="footer-col-title">${e.t}</div>
        ${e.links.map(s=>`<a href="#">${s}</a>`).join("")}
      </div>`).join("")}
  </div>
  <div class="footer-bottom">
    <span>© 2026 Attitude Sports. Tous droits réservés.</span>
    <div><a href="#">Confidentialité</a><a href="#">Conditions</a><a href="#">Accessibilité</a></div>
  </div>
</footer>`,f=()=>`
<main>
  <section class="hero">
    ${N()}
    <div class="hero-shade"></div>
    <div class="hero-inner">
      <div class="eyebrow">Collection automne 2026</div>
      <h1>Dépasse<br>tes limites</h1>
      <div class="hero-ctas">
        <a href="#/hommes" class="btn orange">Magasiner hommes</a>
        <a href="#/femmes" class="btn ghost">Magasiner femmes</a>
      </div>
    </div>
  </section>
  <section class="cats">
    ${[["hommes","Hommes","/images/V5-6008988-008_BC.png"],["femmes","Femmes","/woman.png"],["enfants","Enfants","/enfant.png"]].map(([e,s,a])=>`
      <a href="#/${e}" class="cat-tile" style="background-image:url('${a}')">
        <span class="cat-name">${s}</span>
      </a>`).join("")}
  </section>
  <section class="pad">
    <div class="section-head">
      <h2>Nouveautés</h2>
      <a href="#/hommes" class="link-more">Tout voir</a>
    </div>
    <div class="grid g4">${y.map(e=>v(e)).join("")}</div>
  </section>
  <section class="split">
    ${w("visuel — textile technique en gros plan","split-ph")}
    <div class="split-txt">
      <div class="eyebrow">Technologie AS-Dry</div>
      <h2>Reste au sec.<br>Reste concentré.</h2>
      <p>Un tissu qui évacue la transpiration et sèche en un temps record. Conçu pour l'entraînement, pensé pour tous les jours.</p>
      <a href="#/hommes" class="btn ghost">Découvrir</a>
    </div>
  </section>
  <section class="benefits">
    ${k.map(e=>`<div><strong>${e.t}</strong><span>${e.d}</span></div>`).join("")}
  </section>
</main>`,p=(e,s,a="check",i=!1)=>`
<div class="filter ${i?"accent":""}">
  <div class="filter-title">${e}</div>
  ${a==="check"?`<div class="filter-list">${s.map(t=>`<label><input type="checkbox"> ${t}</label>`).join("")}</div>`:`<div class="filter-chips">${s.map(t=>`<span class="size">${t}</span>`).join("")}</div>`}
</div>`,m=e=>{const s=C[e];let a=b.filter(i=>i.d.includes(e));return n.sort==="price-asc"&&(a=[...a].sort((i,t)=>i.n-t.n)),n.sort==="price-desc"&&(a=[...a].sort((i,t)=>t.n-i.n)),n.sort==="new"&&(a=[...a].sort((i,t)=>(t.badge==="Nouveau"?1:0)-(i.badge==="Nouveau"?1:0))),`
<main>
  <section class="plp-band">
    <div class="eyebrow">Collection</div>
    <h1>${s.label}</h1>
    <p>${s.sub}</p>
    <div class="chips">${s.cats.map(i=>`<span>${i}</span>`).join("")}</div>
  </section>
  <div class="pad">
    <div class="crumbs"><a href="#/">Accueil</a> / <b>${s.label}</b></div>
    <div class="plp-head">
      <span class="count">${a.length} articles</span>
      <select id="sort-select">
        <option value="featured" ${n.sort==="featured"?"selected":""}>Trier : En vedette</option>
        <option value="new" ${n.sort==="new"?"selected":""}>Nouveautés</option>
        <option value="price-asc" ${n.sort==="price-asc"?"selected":""}>Prix croissant</option>
        <option value="price-desc" ${n.sort==="price-desc"?"selected":""}>Prix décroissant</option>
      </select>
    </div>
    <div class="plp-layout">
      <aside class="aside">
        <div class="aside-head"><span>Filtres</span><a href="#">Tout effacer</a></div>
        ${p("Type de produit",s.cats)}
        ${p("Taille",s.sizes,"chips")}
        ${p("Prix",["Moins de 30 $","30 $ – 60 $","60 $ et plus"])}
        <div class="filter">
          <div class="filter-title">Couleur</div>
          <div class="swatches">
            <span style="background:#16161A"></span><span style="background:#FF5A1F"></span>
            <span style="background:#9C9CA4"></span><span style="background:#F2F0EB;border:1px solid #9C9CA4"></span>
          </div>
        </div>
        ${p("Coupe",P)}
        ${p("Technologie",T)}
        ${e==="outlet"?p("Rabais",L,"check",!0):""}
        ${p("Évaluation",F)}
      </aside>
      <div>
        <div class="grid g3">${a.map(i=>v(i)).join("")}</div>
        <div class="pagination"><span class="active">1</span><span>2</span><span>3</span><span>→</span></div>
      </div>
    </div>
  </div>
</main>`},A=()=>{const e=n.q.trim().toLowerCase(),s=e?b.filter(a=>(a.name+" "+a.cat).toLowerCase().includes(e)):[];return`
<main class="pad search-page">
  <h1 class="search-title">Résultats pour «${n.q}» <em>(${s.length} article${s.length===1?"":"s"})</em></h1>
  ${s.length?`<div class="grid g4">${s.map(a=>v(a)).join("")}</div>`:'<div class="empty">Aucun résultat. Essayez «t-shirt», «legging» ou «chaussure».</div>'}
</main>`},R=()=>`
<main class="pad">
  <div class="crumbs"><a href="#/">Accueil</a> / <a href="#/hommes">Hommes</a> / <b>T-shirt AS-Dry Performance</b></div>
  <div class="pdp">
    <div class="gallery">
      <div class="thumbs">${[1,2,3,4].map(()=>"<div></div>").join("")}</div>
      ${w("photo produit principale — t-shirt porté","gallery-main")}
    </div>
    <div class="buybox">
      <div class="eyebrow">Nouveauté</div>
      <h1>T-shirt AS-Dry Performance</h1>
      <div class="pdp-cat">Entraînement · Homme</div>
      <div class="pdp-price">34,99 $</div>
      <div class="filter-title">Couleur : Noir carbone</div>
      <div class="swatches lg">
        <span class="sel" style="background:#16161A"></span><span style="background:#FF5A1F"></span>
        <span style="background:#9C9CA4"></span><span style="background:#F2F0EB;border:1px solid #9C9CA4"></span>
      </div>
      <div class="size-head"><span class="filter-title">Taille</span><a href="#">Guide des tailles</a></div>
      <div class="sizes-grid">${C.hommes.sizes.slice(0,6).map(e=>`<span class="size">${e}</span>`).join("")}</div>
      <button class="btn orange full">Ajouter au panier</button>
      <div class="pdp-ship">Livraison gratuite à partir de 150 $ · Retours sous 60 jours</div>
      <div class="acc open"><div class="acc-head">Description <span>+</span></div>
        <p>Tissu AS-Dry qui évacue la transpiration et sèche rapidement. Coupe athlétique, col rond côtelé, coutures plates anti-frottement. 90 % polyester, 10 % élasthanne.</p>
      </div>
      <div class="acc"><div class="acc-head">Livraison et retours <span>+</span></div></div>
      <div class="acc"><div class="acc-head">Entretien <span>+</span></div></div>
    </div>
  </div>
  <section class="related">
    <h2>Vous aimerez aussi</h2>
    <div class="grid g4">${y.map(e=>v(e,!1)).join("")}</div>
  </section>
</main>`,z={"":f,"/":f,"/hommes":()=>m("hommes"),"/femmes":()=>m("femmes"),"/enfants":()=>m("enfants"),"/chaussures":()=>m("chaussures"),"/outlet":()=>m("outlet"),"/produit":R,"/recherche":A};function $(){const e=location.hash.replace("#","")||"/",s=z[e]||f;S.innerHTML=j()+M()+s()+O(),B(),x(),window.scrollTo(0,0)}function B(){document.getElementById("search-input").addEventListener("input",a=>{n.q=a.target.value,n.q.trim()?location.hash!=="#/recherche"?location.hash="#/recherche":S.querySelector("main").outerHTML=A():location.hash==="#/recherche"&&(location.hash="#/");const i=document.getElementById("search-input");i.focus(),i.setSelectionRange(i.value.length,i.value.length)});const s=document.getElementById("sort-select");s&&s.addEventListener("change",a=>{n.sort=a.target.value,$()})}let g=null;function x(){g&&clearInterval(g);let e=0;g=setInterval(()=>{const s=document.querySelectorAll(".hero-slot");s.length&&(e=(e+1)%5,s.forEach(a=>{a.querySelectorAll(".hero-img").forEach((i,t)=>{i.classList.toggle("active",t===e)})}))},3500)}window.addEventListener("hashchange",$);$();
