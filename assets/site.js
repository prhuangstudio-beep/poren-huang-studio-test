if('scrollRestoration' in history)history.scrollRestoration='manual';
// The lightweight local test server serves physical HTML files and has no
// extensionless-route rewrite. Normalise only its internal section links so
// every test-site page remains reachable by clicking the site navigation.
if(location.hostname==='127.0.0.1'){
  const testPages=new Set(['about','works','exhibitions','press','series','work']);
  document.querySelectorAll('a[href]').forEach(link=>{
    const target=new URL(link.getAttribute('href'),location.href);
    const pageName=target.pathname.replace(/^\/+|\/+$/g,'');
    if(target.origin===location.origin&&testPages.has(pageName)){
      link.href=`${target.pathname}.html${target.search}${target.hash}`;
    }
  });
}
window.addEventListener('pageshow',()=>{
  document.body.classList.remove('page-entering','page-leaving');
  document.querySelectorAll('#year').forEach(x=>x.textContent=new Date().getFullYear());
  window.scrollTo(0,0);
});

if(matchMedia('(pointer:fine)').matches){
  const cursor=document.createElement('i');
  cursor.className='site-cursor';
  document.body.append(cursor);
  let cursorX=0,cursorY=0,cursorFrame=0;
  const renderCursor=()=>{
    cursorFrame=0;
    cursor.style.transform=`translate3d(${cursorX}px,${cursorY}px,0)`;
  };
  const moveCursor=e=>{
    cursorX=e.clientX;
    cursorY=e.clientY;
    if(!cursorFrame)cursorFrame=requestAnimationFrame(renderCursor);
    cursor.classList.add('is-visible');
  };
  window.addEventListener('onpointerrawupdate'in window?'pointerrawupdate':'pointermove',moveCursor,{passive:true});
  document.addEventListener('mouseover',e=>{
    cursor.classList.toggle('is-active',!!e.target.closest('a,button,[role="button"],input,select,textarea,.work-stage,.news article'));
  });
}

document.querySelectorAll('#year').forEach(x=>x.textContent=new Date().getFullYear());
document.querySelectorAll('[data-press-list]').forEach(list=>{
  const limit=list.dataset.pressLimit==='all'?Infinity:5;
  list.replaceChildren(...(window.pressItems||[]).slice(0,limit).map(item=>{
    const card=document.createElement('a'),meta=[item.source,item.date,item.category].filter(Boolean).join('．');
    card.className='press-card';
    card.href=item.url;
    card.target='_blank';
    card.rel='noopener noreferrer';
    card.innerHTML='<h3></h3><p></p>';
    card.querySelector('h3').textContent=item.title;
    card.querySelector('p').textContent=meta;
    return card;
  }));
});
document.querySelectorAll('img:not([loading])').forEach(image=>{
  if(!image.closest('.hero,.video-banner,.work-main,.work-stage'))image.loading='lazy';
  image.decoding='async';
});
// Keep the first visible artwork views responsive without touching their
// existing picture/srcset choices. Everything further down remains lazy.
document.querySelectorAll('.artist-slides img.active,.series-slides img.active,.work-main img,.works-image-grid .work-card:nth-child(-n+4) img,body.home .work-panel:nth-child(-n+2) img').forEach(image=>{
  image.loading='eager';
  image.fetchPriority='high';
});

const header=document.querySelector('header'),nav=document.querySelector('nav');
if(header&&nav){
  // The header stores while reading downward, while resting in a section, and returns on reverse scroll.
  let headerLastY=window.scrollY,headerReference=window.scrollY,headerFrame=0,headerIdleTimer=0;
  const scheduleHeaderIdle=()=>{
    clearTimeout(headerIdleTimer);
    if(window.scrollY<96||document.body.classList.contains('menu-open')||document.body.classList.contains('search-open'))return;
    headerIdleTimer=setTimeout(()=>header.classList.add('is-stowed'),1400);
  };
  const updateHeader=()=>{
    headerFrame=0;
    const y=window.scrollY;
    if(!document.body.classList.contains('menu-open')&&!document.body.classList.contains('search-open')){
      if(y<96){header.classList.remove('is-stowed');headerReference=y;}
      else if(y-headerReference>42){header.classList.add('is-stowed');headerReference=y;}
      else if(headerReference-y>20){header.classList.remove('is-stowed');headerReference=y;}
    }
    headerLastY=y;
  };
  addEventListener('scroll',()=>{if(!headerFrame)headerFrame=requestAnimationFrame(updateHeader);scheduleHeaderIdle()},{passive:true});
  ['pointerdown','touchstart','keydown'].forEach(type=>addEventListener(type,()=>{
    if(document.body.classList.contains('menu-open')||document.body.classList.contains('search-open'))return;
    header.classList.remove('is-stowed');
    scheduleHeaderIdle();
  },{passive:true}));
  scheduleHeaderIdle();
  let searchDataLoading=false;
  const loadSearchData=()=>{
    if(window.POREN_SEARCH_ENTRIES||searchDataLoading)return;
    searchDataLoading=true;
    const searchData=document.createElement('script');
    searchData.src='assets/search-data.js?v=20260910k';
    searchData.defer=true;
    searchData.addEventListener('load',()=>searchPanel.classList.contains('open')&&renderSearch());
    document.head.append(searchData);
  };
  document.body.append(nav);
  [...nav.querySelectorAll('a')].forEach(link=>{
    if(link.getAttribute('href')?.includes('#contact'))link.remove();
    else if(link.getAttribute('href')?.includes('#press'))link.href='press';
    else if(link.getAttribute('href')?.includes('about'))link.textContent='Artist';
    else if(link.getAttribute('href')?.includes('exhibitions'))link.textContent='News';
  });
  // Keep the complete site map available from every overlay menu.
  if(!nav.querySelector('a[href="/"]')){
    const homeLink=document.createElement('a');
    homeLink.href='/';
    homeLink.textContent='Home';
    nav.prepend(homeLink);
  }
  if(!nav.querySelector('a[href="series"]')){
    const seriesLink=document.createElement('a');
    seriesLink.href='series';
    seriesLink.textContent='Series';
    seriesLink.className='menu-series-link';
    nav.append(seriesLink);
  }
  const navLinks=[...nav.children].filter(item=>item.tagName==='A');
  const social=document.createElement('div');
  social.className='menu-socials';
  social.innerHTML='<a href="https://www.instagram.com/porenhuang" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span class="social-label">IG</span></a><a href="https://www.facebook.com/share/1bvSVWuj5K/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span class="social-label">f</span></a><a href="https://youtube.com/@porenhuang" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3z"/></svg></a><a href="https://mail.google.com/mail/?view=cm&fs=1&to=pr_dogs@yahoo.com.tw" target="_blank" rel="noopener noreferrer" aria-label="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m4 7 8 6 8-6"/></svg></a><a href="https://www.threads.com/@porenhuang" target="_blank" rel="noopener noreferrer" aria-label="Threads"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c-5 0-8 3.2-8 8.3 0 5.3 3 8.7 7.9 8.7 4 0 6.6-2.5 6.6-6 0-3.2-2.1-5.3-5.2-5.3-2.8 0-4.7 1.6-4.7 4 0 2 1.3 3.3 3.2 3.3 1.7 0 2.8-1 2.8-2.6 0-1.8-1.5-3-3.8-3"/></svg></a>';
  nav.append(social);
  const searchButton=document.createElement('button');
  searchButton.className='site-search-toggle';
  searchButton.type='button';
  searchButton.setAttribute('aria-label','Search site');
  searchButton.innerHTML='<span aria-hidden="true"></span>';
  header.append(searchButton);
  const searchPanel=document.createElement('div');
  searchPanel.className='site-search-panel';
  searchPanel.innerHTML='<div class="site-search-box"><input type="search" placeholder="Search" aria-label="Search site"><div class="site-search-shortcuts"><div class="site-search-pages">'+navLinks.map(link=>'<a href="'+link.getAttribute('href')+'">'+link.textContent+'</a>').join('')+'</div><div class="site-search-icons">'+social.innerHTML+'</div></div><div class="site-search-results" aria-live="polite"></div></div>';
  document.body.append(searchPanel);
  const searchInput=searchPanel.querySelector('input'),searchResults=searchPanel.querySelector('.site-search-results');
  const normalizeSearch=value=>String(value||'').toLowerCase().replace(/[’'`]/g,'').replace(/[^a-z0-9\u4e00-\u9fff]+/g,' ').trim();
  const renderSearch=()=>{
    const term=normalizeSearch(searchInput.value);
    const entries=window.POREN_SEARCH_ENTRIES||[];
    if(!term){
      searchResults.innerHTML='';
      return;
    }
    const terms=term.split(/\s+/).filter(Boolean);
    const results=entries
      .map(entry=>({entry,haystack:normalizeSearch([entry.title,entry.type,entry.text].join(' '))}))
      .filter(item=>terms.every(word=>item.haystack.includes(word)))
      .slice(0,18)
      .map(item=>item.entry);
    searchResults.innerHTML=results.length?results.map(entry=>'<a href="'+entry.url+'"><span>'+entry.type+'</span><strong>'+entry.title+'</strong></a>').join(''):'<p>No results</p>';
  };
  const openSearch=()=>{
    loadSearchData();
    searchPanel.classList.add('open');
    searchButton.setAttribute('aria-expanded','true');
    renderSearch();
    setTimeout(()=>searchInput.focus(),80);
  };
  const closeSearch=()=>{
    searchPanel.classList.remove('open');
    searchButton.setAttribute('aria-expanded','false');
    searchInput.value='';
  };
  searchButton.addEventListener('click',()=>searchPanel.classList.contains('open')?closeSearch():openSearch());
  searchInput.addEventListener('input',renderSearch);
  searchPanel.addEventListener('click',event=>{if(event.target===searchPanel)closeSearch()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSearch()});
}

const hero=document.querySelector('.hero');
if(hero){
  document.body.classList.add('home');
  document.body.classList.add('intro-active');
  const heroVideo=document.querySelector('.video-banner__foreground');
  const artistFilmVideo=document.querySelector('.artist-film__foreground');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let introCleared=false;
  let artistFilmVisible=false;
  const prepareArtistFilm=()=>{
    if(!artistFilmVideo||reducedMotion||artistFilmVideo.dataset.loaded)return;
    const source=document.createElement('source');
    source.src=matchMedia('(max-width: 900px)').matches?artistFilmVideo.dataset.mobileSrc:artistFilmVideo.dataset.desktopSrc;
    source.type='video/mp4';
    artistFilmVideo.append(source);
    artistFilmVideo.dataset.loaded='true';
    artistFilmVideo.preload='auto';
    artistFilmVideo.muted=true;
    artistFilmVideo.playsInline=true;
    artistFilmVideo.load();
  };
  artistFilmVideo?.addEventListener('canplaythrough',()=>{
    document.body.dataset.artistFilmReady='true';
    window.dispatchEvent(new Event('poren:artist-film-ready'));
  },{once:true});
  const warmHeroVideo=()=>{
    if(!heroVideo||reducedMotion)return;
    document.body.dataset.heroMediaStarted='true';
    window.dispatchEvent(new Event('poren:hero-media-start'));
    heroVideo.preload='auto';
    heroVideo.muted=true;
    heroVideo.autoplay=true;
    heroVideo.playsInline=true;
    if(!heroVideo.dataset.loaded){heroVideo.dataset.loaded='true';heroVideo.load();}
    heroVideo.play().catch(()=>{});
    // Download with the first film; playback remains visibility-gated below.
    prepareArtistFilm();
  };
  // Keep the opening route as the first network priority. The large hero film
  // starts only after the overlay has finished, when it can actually be seen.
  heroVideo?.removeAttribute('autoplay');
  if(heroVideo)heroVideo.preload='metadata';
  // The Artist film shares the first-film download window, while playback
  // remains gated by visibility so it does not compete for rendering work.
  artistFilmVideo?.removeAttribute('autoplay');
  if(artistFilmVideo)artistFilmVideo.preload='none';
  const warmArtistFilm=()=>{
    if(!artistFilmVideo||reducedMotion)return;
    prepareArtistFilm();
    if(!introCleared||!artistFilmVisible)return;
    artistFilmVideo.play().catch(()=>{});
  };
  if(artistFilmVideo&&'IntersectionObserver' in window){
    const artistFilmObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      artistFilmVisible=entry.isIntersecting;
      if(artistFilmVisible)warmArtistFilm();
      else artistFilmVideo.pause();
    }),{rootMargin:'320px 0px'});
    artistFilmObserver.observe(artistFilmVideo);
  }else setTimeout(warmArtistFilm,4000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&introCleared){warmHeroVideo();if(artistFilmVisible)warmArtistFilm();}else artistFilmVideo?.pause();});
  window.scrollTo(0,0);
  const intro=document.createElement('div');
  intro.className='intro-screen';
  // Keep the originally approved walking source: its pose, scale and cadence
  // define the opening animation. The large page films are deferred instead.
  intro.innerHTML='<div class="intro-screen__walker" aria-hidden="true"><img class="intro-screen__walker-canvas intro-screen__walker-image" src="assets/media/intro-character-continuous-alpha.webp" alt=""></div><span><strong class="intro-word">POREN</strong><em class="intro-gap" aria-hidden="true">&nbsp;</em><strong class="intro-word">HUANG</strong><small>SCULPTURE</small></span>';
  document.body.prepend(intro);
  const introWalkImage=intro.querySelector('.intro-screen__walker-image');
  // The approved alpha animation is used on every screen: it preserves the
  // black outline and avoids browser-side green-screen processing.
  const useMobileIntroImage=true;
  let introExitTimer=0,introFallbackTimer=0;
  const fadeIntroToHome=()=>{
    if(intro.dataset.fading)return;
    intro.dataset.fading='true';
    document.body.classList.remove('intro-home-hidden');
    intro.classList.add('is-revealing');
    // White field, lettering and character share one final 0.6 s fade.
    intro.classList.add('is-final');
    setTimeout(clearIntro,600);
  };
  const beginIntroExit=()=>{
    // Start preparing the hero one second into the opening, then reveal it
    // behind the uninterrupted walk. The fade never exposes a blank frame.
    if(heroVideo&&heroVideo.readyState>=3&&!heroVideo.paused){fadeIntroToHome();return;}
    heroVideo?.addEventListener('playing',fadeIntroToHome,{once:true});
    warmHeroVideo();
  };
  const beginIntroWalk=()=>{
    if(intro.classList.contains('is-walking'))return;
    clearTimeout(introFallbackTimer);
    intro.classList.add('is-walking');
    clearTimeout(introExitTimer);
    // The uninterrupted three-second walk ends in one shared 0.6 s fade.
    introExitTimer=setTimeout(beginIntroExit,3000);
  };
  document.body.classList.add('intro-home-hidden');
  setTimeout(warmHeroVideo,1000);
  if(useMobileIntroImage){
    // Animated WebP retains alpha on mobile browsers that flatten WebM alpha.
    // Begin the shared timeline only after the first transparent frame is ready.
    const beginWhenDecoded=()=>{const decoded=introWalkImage.decode?.();if(decoded?.then)decoded.catch(()=>{}).finally(beginIntroWalk);else beginIntroWalk();};
    if(introWalkImage.complete&&introWalkImage.naturalWidth)beginWhenDecoded();
    else introWalkImage.addEventListener('load',beginWhenDecoded,{once:true});
    introFallbackTimer=setTimeout(beginIntroWalk,8000);
  }
  document.documentElement.classList.remove('home-preintro');
  const alignIntroWalker=()=>{
    const gap=intro.querySelector('.intro-gap');
    const canvas=introWalkImage;
    if(!gap||!canvas)return;
    const rect=gap.getBoundingClientRect();
    canvas.style.left=`${rect.left+(rect.width/2)}px`;
  };
  const realignIntro=()=>{alignIntroWalker();};
  requestAnimationFrame(()=>requestAnimationFrame(realignIntro));
  setTimeout(realignIntro,120);
  window.addEventListener('resize',realignIntro);
  document.fonts?.ready?.then(alignIntroWalker);
  const clearIntro=()=>{
    if(introCleared)return;
    introCleared=true;
    window.removeEventListener('resize',realignIntro);
    clearTimeout(introExitTimer);
    clearTimeout(introFallbackTimer);
    window.scrollTo(0,0);
    document.body.classList.remove('intro-active');
    intro.remove();
    window.dispatchEvent(new Event('poren:intro-complete'));
    warmHeroVideo();
    if(artistFilmVisible)warmArtistFilm();
  };
  intro.addEventListener('animationend',e=>{
    if(e.animationName==='intro-out'){
      clearIntro();
    }
  });
  // Both desktop and mobile are driven only by beginIntroWalk: lettering and
  // character share one fixed 3.0 s walk plus 0.6 s fade timeline.
  const homeNav=document.createElement('div');
  homeNav.className='home-section-nav';
  homeNav.setAttribute('role','navigation');
  homeNav.setAttribute('aria-label','Home sections');
  homeNav.innerHTML=[
    ['Home','#top'],
    ['Artist','#artist'],
    ['Series','#series'],
    ['Works','#works'],
    ['News','#news'],
    ['Press','#press'],
    ['Contact','#contact']
  ].map(([label,target])=>'<a href="'+target+'">'+label+'</a>').join('');
  document.body.append(homeNav);
  const homeNavLinks=[...homeNav.querySelectorAll('a')];
  homeNavLinks.forEach(link=>{
    link.addEventListener('click',event=>{
      const selector=link.getAttribute('href');
      window.dispatchEvent(new CustomEvent('poren:section-select',{detail:{selector}}));
      if(selector==='#top'){
        event.preventDefault();
        window.scrollTo({top:0,behavior:'smooth'});
        return;
      }
      const target=document.querySelector(selector);
      if(target){
        event.preventDefault();
        target.scrollIntoView({block:'start',behavior:'smooth'});
      }
    });
  });
  const homeSections=homeNavLinks.map(link=>({
    link,
    target:link.getAttribute('href')==='#top'?document.body:document.querySelector(link.getAttribute('href'))
  })).filter(item=>item.target);
  const updateHomeNav=()=>{
    const current=homeSections.reduce((active,item)=>{
      const top=item.target===document.body?0:item.target.getBoundingClientRect().top;
      return top<=innerHeight*.42?item:active;
    },homeSections[0]);
    homeNavLinks.forEach(link=>link.classList.toggle('active',link===current.link));
    document.body.dataset.homeSection=current.link.getAttribute('href')||'#top';
  };
  updateHomeNav();
  addEventListener('scroll',updateHomeNav,{passive:true});
}

const page=document.querySelector('.page');
if(page){
  if(location.pathname.includes('about'))page.dataset.label='';
  else if(location.pathname.includes('works'))page.dataset.label='WORKS';
  else page.dataset.label='';
  const existingBack=page.querySelector('.page-back,.back-to-works');
  if(existingBack){
    existingBack.className='page-back key-back';
    existingBack.setAttribute('aria-label','Back');
    existingBack.innerHTML='<img class="back-key-image" src="/assets/media/ui/back-dog-bowl.png" alt="">';
    page.classList.add('has-page-back');
  }else{
    const back=document.createElement('a');
    back.className='page-back key-back';
    back.href=location.pathname.includes('/works/')?'../works':'/';
    back.setAttribute('aria-label','Back');
    back.innerHTML='<img class="back-key-image" src="/assets/media/ui/back-dog-bowl.png" alt="">';
    page.prepend(back);
    page.classList.add('has-page-back');
  }
}

document.querySelectorAll('.news article[data-start],.timeline article[data-start],.timeline article[data-ended],.timeline article[data-permanent]').forEach(article=>{
  const start=new Date(article.dataset.start+'T00:00:00');
  const end=new Date(article.dataset.end+'T23:59:59');
  const now=new Date();
  const label=article.hasAttribute('data-permanent')?'PERMANENT':article.hasAttribute('data-ended')?'ENDED':now<start?'UPCOMING':now>end?'ENDED':'CURRENT';
  const existing=article.querySelector('.status-badge,.news-status');
  existing?.remove();
  if(article.closest('.news')){
    const status=document.createElement('span');
    status.className='news-status status-'+label.toLowerCase();
    status.textContent=label;
    article.append(status);
  }else{
    const target=article.querySelector('.eyebrow');
    if(target)target.insertAdjacentHTML('beforeend',' <span class="status-badge status-'+label.toLowerCase()+'">'+label+'</span>');
  }
});

const form=document.querySelector('.contact-form'),emailLinks=document.querySelectorAll('a[href^="mailto:pr_dogs@yahoo.com.tw"]');
if(form){
  const modal=document.createElement('div');
  modal.className='email-modal';
  document.body.append(modal);
  modal.append(form);
  const openGmailCompose=(body,subject='Poren Huang Studio enquiry')=>{
    const url='https://mail.google.com/mail/?view=cm&fs=1&to=pr_dogs@yahoo.com.tw&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body||'');
    window.open(url,'poren-gmail-compose','width=720,height=680,noopener');
  };
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const name=form.elements.name?.value.trim()||'';
    const email=form.elements.email?.value.trim()||'';
    const message=form.elements.message?.value.trim()||'';
    const body=['Name: '+name,'Email: '+email,'','Message:',message].join('\n');
    openGmailCompose(body);
  });
  emailLinks.forEach(email=>{
    email.addEventListener('click',e=>{
      e.preventDefault();
      openGmailCompose('');
    });
  });
  modal.addEventListener('click',e=>{
    if(e.target===modal)modal.classList.remove('open');
  });

}

const stage=document.querySelector('.work-stage');
// On the homepage this is replaced by the dedicated continuously moving
// ticker below. Detect it from the hero itself: body.home is assigned later.
if(stage&&!document.querySelector('.hero')){
  const section=stage.closest('.side-section'),head=section.querySelector('.section-head'),allLink=head?.querySelector('a');
  section.classList.add('works-section');
  if(allLink){
    allLink.classList.add('all-works');
    stage.insertAdjacentElement('afterend',allLink);
  }
  head?.remove();
  let stageVelocity=0,stageFrame=0;
  const glideStage=()=>{
    stage.scrollLeft+=stageVelocity;
    stageVelocity*=.88;
    if(Math.abs(stageVelocity)>.12)stageFrame=requestAnimationFrame(glideStage);
    else{
      stageVelocity=0;
      stageFrame=0;
    }
  };
  stage.addEventListener('wheel',e=>{
    const wheelMove=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(wheelMove){
      e.preventDefault();
      const unit=e.deltaMode===1?18:1;
      stageVelocity+=wheelMove*unit*.42;
      stageVelocity=Math.max(-58,Math.min(58,stageVelocity));
      if(!stageFrame)stageFrame=requestAnimationFrame(glideStage);
    }
  },{passive:false});
  let pointerDown=false,dragging=false,suppressStageClick=false,startX=0,startLeft=0,startLink=null;
  stage.addEventListener('pointerdown',e=>{
    pointerDown=true;
    dragging=false;
    stageVelocity=0;
    startX=e.clientX;
    startLeft=stage.scrollLeft;
    startLink=e.target.closest('a[href]');
    if(e.pointerId&&stage.setPointerCapture)stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',e=>{
    if(!pointerDown)return;
    const delta=e.clientX-startX;
    if(!dragging&&Math.abs(delta)>7){
      dragging=true;
      stage.classList.add('dragging');
    }
    if(dragging)stage.scrollLeft=startLeft-delta;
  });
  const stopDrag=e=>{
    if(stage.releasePointerCapture&&e.pointerId)try{stage.releasePointerCapture(e.pointerId)}catch{}
    suppressStageClick=dragging&&Math.abs(e.clientX-startX)>7;
    if(!suppressStageClick&&startLink){
      e.preventDefault();
      if(window.porenNavigate)window.porenNavigate(startLink.href);
      else window.location.assign(startLink.href);
    }
    pointerDown=false;
    dragging=false;
    startLink=null;
    stage.classList.remove('dragging');
    if(suppressStageClick)setTimeout(()=>suppressStageClick=false,0);
  };
  stage.addEventListener('pointerup',stopDrag);
  stage.addEventListener('pointercancel',()=>{
    pointerDown=false;
    dragging=false;
    startLink=null;
    stage.classList.remove('dragging');
  });
  stage.querySelectorAll('.work-panel[href]').forEach(panel=>{
    panel.addEventListener('click',event=>{
      if(suppressStageClick)event.preventDefault();
    });
  });
  stage.insertAdjacentHTML('beforeend','<a class="more-panel" href="works">view more...</a>');
}

document.querySelectorAll('.home .news article').forEach(article=>{
  article.addEventListener('click',()=>{
    if(window.porenNavigate)window.porenNavigate('exhibitions');
    else location.href='exhibitions';
  });
  article.setAttribute('role','link');
  article.tabIndex=0;
});

document.querySelectorAll('.image-carousel').forEach(carousel=>{
  const slides=[...carousel.querySelectorAll('img')];
  if(slides.length<2)return;
  let index=Math.max(0,slides.findIndex(slide=>slide.classList.contains('active')));
  const setCarouselCover=()=>carousel.style.setProperty('--cover-image','url("'+slides[index].src+'")');
  slides.forEach((slide,i)=>slide.classList.toggle('active',i===index));
  slides[index].complete?setCarouselCover():slides[index].addEventListener('load',setCarouselCover,{once:true});
  setInterval(()=>{
    if(document.hidden)return;
    const next=(index+1)%slides.length;
    slides[next].classList.add('active');
    slides[index].classList.remove('active');
    index=next;
    setCarouselCover();
  },4200);
});

const artistSwitch=document.querySelector('.artist-switch');
if(artistSwitch){
  const buttons=[...artistSwitch.querySelectorAll('[data-artist-tab]')];
  const panels=[...document.querySelectorAll('[data-artist-panel]')];
  const showPanel=name=>{
    buttons.forEach(button=>{
      const active=button.dataset.artistTab===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
    panels.forEach(panel=>{
      const active=panel.dataset.artistPanel===name;
      panel.classList.toggle('active',active);
      panel.toggleAttribute('hidden',!active);
    });
  };
  panels.forEach(panel=>panel.toggleAttribute('hidden',!panel.classList.contains('active')));
  buttons.forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.artistTab)));
}

const cv=document.querySelector('.artist-cv');
if(cv){
  const articles=[...cv.querySelectorAll('article')];
  articles.forEach(article=>article.hidden=false);
  cv.classList.remove('is-collapsed');
  cv.querySelector('.cv-toggle')?.remove();
}

const footerSocialLinks='<a href="https://www.instagram.com/porenhuang" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span class="social-label">IG</span></a><a href="https://www.facebook.com/share/1bvSVWuj5K/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span class="social-label">f</span></a><a href="https://youtube.com/@porenhuang" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3z"/></svg></a><a href="https://mail.google.com/mail/?view=cm&fs=1&to=pr_dogs@yahoo.com.tw" target="_blank" rel="noopener noreferrer" aria-label="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m4 7 8 6 8-6"/></svg></a><a href="https://www.threads.com/@porenhuang" target="_blank" rel="noopener noreferrer" aria-label="Threads"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c-5 0-8 3.2-8 8.3 0 5.3 3 8.7 7.9 8.7 4 0 6.6-2.5 6.6-6 0-3.2-2.1-5.3-5.2-5.3-2.8 0-4.7 1.6-4.7 4 0 2 1.3 3.3 3.2 3.3 1.7 0 2.8-1 2.8-2.6 0-1.8-1.5-3-3.8-3"/></svg></a>';
const footer=document.querySelector('footer');
if(footer){
  let socials=footer.querySelector('.socials');
  if(!socials){
    socials=document.createElement('div');
    socials.className='socials';
    footer.querySelector('small')?.before(socials);
  }
  socials.innerHTML=footerSocialLinks;
  if(!footer.querySelector('.contact-me')){
    socials.insertAdjacentHTML('afterend','<a class="contact-me" href="https://mail.google.com/mail/?view=cm&fs=1&to=pr_dogs@yahoo.com.tw" target="_blank" rel="noopener noreferrer" aria-label="Contact Poren Huang by Gmail">CONTACT ME</a>');
  }
  if(!footer.querySelector('.contact-details')){
    footer.querySelector('small')?.insertAdjacentHTML('beforebegin','<address class="contact-details"><a href="mailto:pr_dogs@yahoo.com.tw">pr_dogs@yahoo.com.tw</a><a href="tel:+886926776431">+886 926 776 431</a><span>台中市大甲區甲埔大道800號<br>No. 800, Jiapu Blvd., Dajia Dist., Taichung City 437, Taiwan</span></address>');
  }
}
if(footer&&hero){
  if(!footer.querySelector('.contact-title')){
    footer.insertAdjacentHTML('afterbegin','<p class="contact-title">CONTACT</p>');
  }
  if(!document.querySelector('.end-spacer')){
    footer.insertAdjacentHTML('afterend','<div class="end-spacer" aria-hidden="true"></div>');
  }
}
if(footer&&document.body.classList.contains('home')){
  const contactTitle=footer.querySelector('a.contact-title');
  if(contactTitle){
    const label=document.createElement('p');
    label.className=contactTitle.className;
    label.textContent=contactTitle.textContent;
    contactTitle.replaceWith(label);
  }
}

// Every "view more..." keeps its established base colour. Its only hover
// response is a compact scale, so it behaves consistently across sections.
document.querySelectorAll('a').forEach(link=>{
  if(!/^view more(?:…|\.\.\.)?$/i.test(link.textContent.trim()))return;
  link.style.setProperty('--view-more-base-color',getComputedStyle(link).color);
  link.classList.add('view-more-link');
});

// Replace every final "view more" label with the mirrored key artwork after
// page-specific links have finished moving into their final containers.
const initialiseViewMoreKeys=()=>{
  document.querySelectorAll('a').forEach(link=>{
    if(link.classList.contains('key-view-more'))return;
    if(!/^view more(?:…|\.\.\.)?$/i.test(link.textContent.trim()))return;
    link.classList.add('view-more-link','key-view-more');
    link.setAttribute('aria-label','View more');
    const image=document.createElement('img');
    image.className='view-more-key-image';
    image.src='/assets/media/ui/view-more-key-mirrored.png';
    image.alt='';
    link.replaceChildren(image);
    const setGoldState=showGold=>{
      if(showGold===link.classList.contains('is-gold'))return;
      link.classList.remove('is-gold','is-gold-out');
      // Force a fresh animation when the pointer reverses direction quickly.
      void link.offsetWidth;
      link.classList.add(showGold?'is-gold':'is-gold-out');
    };
    const revealGold=()=>setGoldState(true);
    const concealGold=()=>setGoldState(false);
    link.addEventListener('pointerenter',revealGold);
    link.addEventListener('pointerleave',concealGold);
    link.addEventListener('focus',revealGold);
    link.addEventListener('blur',concealGold);
    link.addEventListener('animationend',event=>{
      if(event.animationName==='view-more-key-gold-out')link.classList.remove('is-gold-out');
    });
  });
};
queueMicrotask(initialiseViewMoreKeys);

const artistGalleryImages=['IMG_2117.JPG','IMG_8234.JPG','IMG_9063.JPG','IMG_9066.JPG','IMG_9119.JPG','IMG_9123.JPG','L1000258.JPG','L1020065.JPG','L1020266.JPG','L1020295.JPG','L1020311.JPG','L1020519.JPG','L1020532.JPG','L1020536.JPG','L1020548.JPG','L1020604.JPG','L1020747.JPG','L1020834.JPG','L1020850.JPG','L1020890.JPG','L1030503.JPG','L1120738.JPG','L1120742.JPG','L1120749.JPG','直微發光.png'];
document.querySelectorAll('[data-artist-gallery]').forEach(gallery=>{
  const files=gallery.dataset.galleryOrder==='reverse'?[...artistGalleryImages].reverse():artistGalleryImages;
  const track=document.createElement('div');
  track.className='artist-gallery-ticker__track';
  const figures=files.map((filename,index)=>{
    const figure=document.createElement('figure');
    const image=document.createElement('img');
    image.loading='lazy';
    image.src=`assets/media/artist-gallery/optimized/${encodeURIComponent(filename.replace(/\.[^.]+$/,'')+'.webp')}`;
    image.alt=`雕塑藝術家黃柏仁 Poren Huang 照片 ${index+1}`;
    figure.append(image);
    return figure;
  });
  const repeats=figures.map(figure=>{
    const copy=figure.cloneNode(true);
    copy.setAttribute('aria-hidden','true');
    copy.querySelector('img').alt='';
    return copy;
  });
  track.append(...figures,...repeats);
  gallery.classList.add('artist-gallery-ticker');
  gallery.replaceChildren(track);
  const contentColumn=gallery.closest('.press-page-layout')?.querySelector('.press-list')||gallery.closest('.artist-cv-layout')?.querySelector('.artist-cv');
  const measureViewport=()=>{
    if(!contentColumn)return;
    gallery.style.setProperty('--artist-gallery-view-height',`${Math.ceil(contentColumn.getBoundingClientRect().height)}px`);
  };
  const measureCycle=()=>{
    const firstRepeat=repeats[0];
    if(firstRepeat)track.style.setProperty('--artist-gallery-cycle',`-${Math.round(firstRepeat.offsetTop)}px`);
  };
  track.querySelectorAll('img').forEach(image=>image.addEventListener('load',measureCycle,{once:true}));
  new ResizeObserver(measureCycle).observe(track);
  if(contentColumn)new ResizeObserver(measureViewport).observe(contentColumn);
  window.addEventListener('resize',measureViewport,{passive:true});
  measureCycle();
  measureViewport();
});

document.querySelectorAll('.work-detail-info .work-heading h1').forEach(title=>{
  if(title.querySelector('.work-title-en'))return;
  const raw=title.textContent.trim().replace(/\s+/g,' ');
  const zhFirst=raw.match(/^([^A-Za-z]+?)\s+(.+)$/);
  const enFirst=raw.match(/^(.+?)\s+([\u4e00-\u9fff].*)$/);
  const en=zhFirst?zhFirst[2]:(enFirst?enFirst[1]:raw);
  const zh=zhFirst?zhFirst[1]:(enFirst?enFirst[2]:'');
  title.replaceChildren();
  const enLine=document.createElement('span');
  enLine.className='work-title-en';
  enLine.textContent=en;
  title.append(enLine);
  if(zh){
    const zhLine=document.createElement('span');
    zhLine.className='work-title-zh';
    zhLine.textContent=zh;
    title.append(zhLine);
  }
});

const fitWorkHeadings=()=>{
  document.querySelectorAll('.work-detail-info .work-heading').forEach(heading=>{
    const title=heading.querySelector('h1'),year=heading.querySelector('span');
    if(!title)return;
    if(title.querySelector('.work-title-en'))return;
    title.style.fontSize='';
    title.style.width='auto';
    title.style.maxWidth='';
    const style=getComputedStyle(heading);
    const gap=parseFloat(style.columnGap||style.gap)||0;
    const available=heading.clientWidth-(year?.offsetWidth||0)-gap;
    if(available<=0)return;
    const baseSize=parseFloat(getComputedStyle(title).fontSize);
    const fullWidth=title.scrollWidth;
    let size=fullWidth>available?Math.floor(baseSize*(available/fullWidth)):baseSize;
    size=Math.max(8,Math.min(baseSize,size));
    title.style.fontSize=size+'px';
    title.style.width=available+'px';
    title.style.maxWidth=available+'px';
    while(title.scrollWidth>available&&size>8){
      size-=.5;
      title.style.fontSize=size+'px';
    }
  });
};
fitWorkHeadings();
requestAnimationFrame(fitWorkHeadings);
document.fonts?.ready.then(fitWorkHeadings);
addEventListener('resize',fitWorkHeadings);
addEventListener('load',fitWorkHeadings);

const revealItems=document.querySelectorAll('h1,h2,h3,.hero p,.hero .image,.artist-portrait,.portrait,.intro p,.artist-detail p,.bio p,.artist-cv article,.news article,.press-card,.timeline article,.series-entry,.home-image-break,.press-side-image,.series-hero figure,.series-hero p,.series-hero .link,.works-image-grid>a,.works-index a,.work-detail,.work-variants,.related-works a,.work-panel,.artist-switch,.artist-tab-panel');
revealItems.forEach(item=>item.classList.add('scroll-reveal'));
if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }),{threshold:.08,rootMargin:'0px 0px -7% 0px'});
  revealItems.forEach(item=>observer.observe(item));
}else revealItems.forEach(item=>item.classList.add('is-visible'));

const homeStage=document.querySelector('body.home .work-stage');
const homeSeries=document.querySelector('body.home #series .series-entry');
const homeImageTicker=document.querySelector('body.home .horizontal-image-ticker__track');
if(document.body.classList.contains('home')){
  // The homepage is a concise preview: the full archive remains available on
  // the News page, while this card never exceeds five readable entries.
  document.querySelectorAll('body.home #news .side-content > article').forEach((article,index)=>{
    article.hidden=index>=5;
  });
}
if(document.body.classList.contains('home')){
  // A long, coloured canvas: eight soft pools are distributed through the
  // document height, while their colours shuffle at every page visit.
  // One chromatic family only: lake green over white, with positions shuffled
  // across the complete document rather than pinned to the viewport.
  const pastel=['rgba(111,205,190,.52)','rgba(151,224,212,.46)','rgba(91,187,173,.38)','rgba(207,244,236,.66)'];
  const colours=[...pastel,...pastel].sort(()=>Math.random()-.5);
  colours.forEach((colour,index)=>{
    const y=7+index*12+Math.random()*6;
    document.body.style.setProperty(`--home-blob-${index+1}-position`,`${Math.round(8+Math.random()*84)}% ${Math.round(y)}%`);
    document.body.style.setProperty(`--home-blob-${index+1}-colour`,colour);
  });
}
if(homeImageTicker){
  // The image strip uses the same base travel rate as the Works ticker
  // (.34 px per 16 ms), but recalculates its loop duration per viewport.
  const syncHomeImageTickerSpeed=()=>{
    const pixelsPerSecond=.34/(16/1000);
    homeImageTicker.style.setProperty('--home-image-ticker-duration',`${(innerWidth/pixelsPerSecond).toFixed(2)}s`);
  };
  syncHomeImageTickerSpeed();
  addEventListener('resize',syncHomeImageTickerSpeed);
}
// Infinite image strips need no compositor time while entirely off screen.
if('IntersectionObserver'in window){
  const animatedStripObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    entry.target.classList.toggle('is-offscreen',!entry.isIntersecting);
  }),{threshold:0});
  document.querySelectorAll('.horizontal-image-ticker,.artist-gallery-ticker').forEach(strip=>animatedStripObserver.observe(strip));
}
if(homeSeries){
  homeSeries.classList.remove('view-more-link');
  const seriesMore=homeSeries.closest('.side-content')?.querySelector('.series-more');
  if(!seriesMore){
    const link=document.createElement('a');
    link.className='series-more view-more-link';
    link.href=homeSeries.getAttribute('href')||'series';
    link.textContent='view more...';
    homeSeries.querySelector('span')?.remove();
    homeSeries.insertAdjacentElement('afterend',link);
  }
}
// Series adds its control after the first key pass; run the idempotent pass
// once more so it receives the same mirrored key and hover behaviour.
queueMicrotask(initialiseViewMoreKeys);
if(homeStage){
  document.querySelectorAll('.work-swipe-hint,.more-panel').forEach(item=>item.remove());
  const worksContent=homeStage.closest('.side-content');
  const worksHead=worksContent?.querySelector('.section-head');
  const worksMore=worksHead?.querySelector('a[href]');
  if(worksMore){
    worksMore.classList.add('works-more');
    homeStage.insertAdjacentElement('afterend',worksMore);
  }
  worksHead?.remove();
  const homeWorksUrl='data/works.json';
  const escapeHtml=value=>String(value).replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
  const startHomeWorksTicker=works=>{
    const groups=new Map();
    works.slice().sort((a,b)=>Number(b.year)-Number(a.year)||String(a.title_en).localeCompare(String(b.title_en))).forEach(work=>{
      const key=[work.year,work.title_en,work.title_zh||''].join('|');
      if(!groups.has(key))groups.set(key,{key,year:work.year,title:work.title_en,variants:[]});
      const image=work.images?.[0];
      if(image)groups.get(key).variants.push({src:image.filename,alt:image.alt_zh||image.alt_en||work.title_en,href:'works/'+work.id+'.html'});
    });
    const recent=[...groups.values()].filter(group=>group.variants.length).slice(0,15);
    if(!recent.length)return;
    const card=group=>{
      const first=group.variants[0];
      return '<a class="work-panel home-ticker-card" href="'+escapeHtml(first.href)+'" data-home-work="'+escapeHtml(group.key)+'" data-variants="'+escapeHtml(JSON.stringify(group.variants))+'"><img loading="lazy" class="home-work-image active" src="'+escapeHtml(first.src)+'" alt="'+escapeHtml(first.alt)+'"><span>'+escapeHtml(group.title)+'<small>'+escapeHtml(group.year)+'</small></span></a>';
    };
    homeStage.innerHTML=recent.map(card).join('')+recent.map(card).join('');
    homeStage.classList.add('works-ticker-ready');
    const panels=[...homeStage.querySelectorAll('.home-ticker-card')];
    let velocity=0,scrollPosition=0,dragging=false,startX=0,startScroll=0,moved=false,pressedPanel=null;
    const loopWidth=()=>homeStage.scrollWidth/2;
    const keepLooped=()=>{
      const cycle=loopWidth();
      if(!cycle)return;
      if(scrollPosition>=cycle)scrollPosition-=cycle;
      if(scrollPosition<0)scrollPosition+=cycle;
      homeStage.scrollLeft=scrollPosition;
    };
    let tickerVisible=false,tickerFrame=0,lastTickerTime=0,coverTimer=0;
    const tick=time=>{
      tickerFrame=0;
      if(!tickerVisible||dragging||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const steps=Math.min(4,Math.max(.25,(time-lastTickerTime)/16.667));
      lastTickerTime=time;
      // scrollLeft stores integer pixels; retain the fractional distance here
      // so the slow continuous movement does not get rounded back to zero.
      scrollPosition+=.34*steps+velocity;
      velocity*=Math.pow(.92,steps);
      if(Math.abs(velocity)<.01)velocity=0;
      keepLooped();
      tickerFrame=requestAnimationFrame(tick);
    };
    const startTicker=()=>{
      if(!tickerVisible||tickerFrame||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      lastTickerTime=performance.now();
      tickerFrame=requestAnimationFrame(tick);
    };
    homeStage.addEventListener('wheel',event=>{
      const movement=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
      if(!movement)return;
      event.preventDefault();
      velocity=Math.max(-48,Math.min(48,velocity+movement*.18));
    },{passive:false});
    homeStage.addEventListener('pointerdown',event=>{
      dragging=true;moved=false;velocity=0;startX=event.clientX;startScroll=scrollPosition;
      pressedPanel=event.target.closest('.home-ticker-card');
      homeStage.setPointerCapture?.(event.pointerId);
    });
    homeStage.addEventListener('pointermove',event=>{
      if(!dragging)return;
      const delta=event.clientX-startX;
      if(Math.abs(delta)>5)moved=true;
      scrollPosition=startScroll-delta;
      keepLooped();
    });
    const release=event=>{
      if(!dragging)return;
      const delta=event.clientX-startX;
      if(Math.abs(delta)>5)velocity=Math.max(-26,Math.min(26,-delta*.12));
      dragging=false;
      try{homeStage.releasePointerCapture?.(event.pointerId)}catch{}
      if(!moved&&pressedPanel?.href){
        event.preventDefault();
        location.href=pressedPanel.href;
        return;
      }
      pressedPanel=null;
      if(moved)setTimeout(()=>moved=false,0);
    };
    homeStage.addEventListener('pointerup',release);
    homeStage.addEventListener('pointercancel',release);
    panels.forEach(panel=>panel.addEventListener('click',event=>{if(moved)event.preventDefault();}));
    const panelsByWork=new Map();
    panels.forEach(panel=>{
      const key=panel.dataset.homeWork;
      if(!panelsByWork.has(key))panelsByWork.set(key,[]);
      panelsByWork.get(key).push(panel);
    });
    const coverIndexes=new Map();
    const changeCover=(panel,variant)=>{
      const image=panel.querySelector('.home-work-image');
      if(!image)return;
      const preload=new Image();
      preload.src=variant.src;
      image.classList.add('is-fading');
      const apply=()=>{
        image.src=variant.src;
        image.alt=variant.alt;
        requestAnimationFrame(()=>image.classList.remove('is-fading'));
      };
      preload.addEventListener('load',apply,{once:true});
      preload.addEventListener('error',()=>image.classList.remove('is-fading'),{once:true});
    };
    const cycleCovers=()=>{
      coverTimer=0;
      if(!tickerVisible||document.hidden)return;
      panelsByWork.forEach((matchingPanels,key)=>{
        const variants=JSON.parse(matchingPanels[0].dataset.variants||'[]');
        if(variants.length<2)return;
        const index=((coverIndexes.get(key)||0)+1)%variants.length;
        coverIndexes.set(key,index);
        matchingPanels.forEach(panel=>changeCover(panel,variants[index]));
      });
      coverTimer=setTimeout(cycleCovers,4800);
    };
    if('IntersectionObserver'in window){
      new IntersectionObserver(entries=>entries.forEach(entry=>{
        tickerVisible=entry.isIntersecting;
        if(tickerVisible){startTicker();clearTimeout(coverTimer);coverTimer=setTimeout(cycleCovers,4800);}
        else {cancelAnimationFrame(tickerFrame);tickerFrame=0;clearTimeout(coverTimer);}
      }),{threshold:.01}).observe(homeStage);
    }else{tickerVisible=true;startTicker();coverTimer=setTimeout(cycleCovers,4800);}
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tickerVisible){startTicker();if(!coverTimer)coverTimer=setTimeout(cycleCovers,4800);}});
  };
  fetch(homeWorksUrl).then(response=>response.ok?response.json():Promise.reject()).then(startHomeWorksTicker).catch(()=>{});
}

// The Works and Series controls are moved while their homepage modules start.
// Position every completed key from its actual card, not from a former wrapper,
// so desktop and mobile use precisely the same left/bottom inset.
const placeHomeCardKeys=()=>{
  if(!document.body.classList.contains('home'))return;
  ['artist','series','works','news','press'].forEach(id=>{
    const section=document.getElementById(id);
    const outerCard=section?.querySelector(':scope > .side-content');
    // Artist's white editorial card is its text panel, unlike the other
    // homepage sections whose white panel is the side-content itself.
    const card=id==='artist'?section?.querySelector('.artist-detail > div'):outerCard;
    const key=card?.querySelector('a.key-view-more')||outerCard?.querySelector('a.key-view-more');
    if(!card||!key)return;
    card.style.setProperty('position','relative','important');
    card.style.setProperty('padding-bottom','5rem','important');
    key.style.setProperty('position','absolute','important');
    key.style.setProperty('left','var(--space-6)','important');
    key.style.setProperty('bottom','var(--space-6)','important');
    key.style.setProperty('margin','0','important');
    key.style.setProperty('z-index','3','important');
  });
};
requestAnimationFrame(()=>{
  initialiseViewMoreKeys();
  placeHomeCardKeys();
});

if(hero){
  ['about','works','exhibitions','press'].forEach((destination,index)=>{
    const label=document.querySelectorAll('.side-title span')[index];
    if(label&&!label.closest('a')){
      const link=document.createElement('a');
      link.href=destination;
      label.before(link);
      link.append(label);
    }
  });
}

// Contact is the final member of the homepage title system. Copy the live
// Press title typography so it stays identical across responsive sizes.
if(document.body.classList.contains('home')){
  const contactTitle=document.querySelector('footer .contact-title');
  const referenceTitle=document.querySelector('#press>.side-title span');
  const syncContactTitle=()=>{
    if(!contactTitle||!referenceTitle)return;
    const reference=getComputedStyle(referenceTitle);
    ['fontFamily','fontSize','fontWeight','letterSpacing','lineHeight'].forEach(property=>contactTitle.style.setProperty(property.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),reference[property],'important'));
    contactTitle.style.setProperty('font-weight','800','important');
  };
  syncContactTitle();
  addEventListener('resize',syncContactTitle,{passive:true});
}

/* Homepage section rails follow their original full section run: each label
   starts with its section, pins beneath the header, then releases at its end. */
if(document.body.classList.contains('home')){
  const homeRails=[...document.querySelectorAll('main > .side-section > .side-title')];
  const railMotion=new Map();
  let railMotionFrame=0;
  const renderRailMotion=()=>{
    railMotionFrame=0;
    let moving=false;
    railMotion.forEach((state,rail)=>{
      state.current+=(state.target-state.current)*.18;
      if(Math.abs(state.target-state.current)<.12)state.current=state.target;
      else moving=true;
      rail.style.setProperty('--home-side-title-y',`${state.current.toFixed(2)}px`);
    });
    if(moving)railMotionFrame=requestAnimationFrame(renderRailMotion);
  };
  const setRailPosition=(rail,target)=>{
    let state=railMotion.get(rail);
    if(!state){
      state={current:target,target};
      railMotion.set(rail,state);
      rail.style.setProperty('--home-side-title-y',`${target}px`);
      return;
    }
    state.target=target;
    if(!railMotionFrame)railMotionFrame=requestAnimationFrame(renderRailMotion);
  };
  const syncHomeRails=()=>{
    const header=document.querySelector('header');
    const pin=(header?.getBoundingClientRect().height||64)+12;
    homeRails.forEach(rail=>{
      const section=rail.parentElement;
      const word=rail.querySelector('span');
      if(!word)return;
      const wordRect=word.getBoundingClientRect();
      const dividerGap=parseFloat(getComputedStyle(section).getPropertyValue('--home-title-divider-clearance'))||32;
      const sectionTop=section.getBoundingClientRect().top+window.scrollY;
      const sectionBottom=sectionTop+section.offsetHeight;
      const stopTop=sectionBottom-wordRect.height-dividerGap;
      const documentTop=Math.max(sectionTop,Math.min(window.scrollY+pin,stopTop));
      const railInsetTop=rail.getBoundingClientRect().top+window.scrollY-sectionTop;
      const nextTop=Math.max(0,documentTop-sectionTop-railInsetTop);
      setRailPosition(rail,nextTop);
    });
  };
  let railQueued=false;
  const queueHomeRailSync=()=>{
    if(railQueued)return;
    railQueued=true;
    requestAnimationFrame(()=>{railQueued=false;syncHomeRails();});
  };
  syncHomeRails();
  addEventListener('scroll',queueHomeRailSync,{passive:true});
  addEventListener('resize',queueHomeRailSync,{passive:true});
  addEventListener('load',queueHomeRailSync,{once:true});
}

document.querySelector('.works-overview .eyebrow')?.remove();
document.querySelectorAll('.more-panel').forEach(link=>{
  link.addEventListener('pointerdown',event=>event.stopPropagation());
  link.addEventListener('click',event=>{
    event.preventDefault();
    if(window.porenNavigate)window.porenNavigate(link.href);
    else location.href=link.href;
  });
});

document.body.classList.add('page-entering');
requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('page-entering')));
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||url.pathname===location.pathname&&url.hash||url.protocol==='mailto:'||url.protocol==='tel:')return;
  event.preventDefault();
  document.body.classList.add('page-leaving');
  setTimeout(()=>location.href=url.href,680);
});

/*
  Site-wide virtual card scroll.
  Tune these three values to adjust the feel without touching layout:
  sensitivity: wheel / touch distance multiplier; damping: lower = more inertia;
  influence: fallback portion of viewport height used by non-home pages.
*/
(()=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  const compact=matchMedia('(max-width: 700px)').matches;
  const homePage=document.body.classList.contains('home');
  const mobileHome=compact&&homePage;
  const desktopWorks=!compact&&!!document.querySelector('.works-overview');
  const mobileWorks=compact&&!!document.querySelector('.works-overview');
  // Homepage uses edge bands: top 15% and bottom 15% carry the depth cue,
  // while the centre 70% remains completely clear.
  const primaryBrowse=homePage||!!document.querySelector('.works-overview');
  const settings={
    damping:desktopWorks ? .16 : (primaryBrowse ? .14 : .11),
    homeEdgeBand:.15,
    influence:mobileHome ? .98 : ((desktopWorks||mobileWorks) ? .74 : .91),
    maxScaleDrop:mobileWorks ? .045 : (desktopWorks ? .045 : (homePage ? (compact ? .03 : .045) : .035)),
    maxBlur:mobileWorks ? 0 : (desktopWorks ? 2.5 : (homePage ? (compact ? 0 : 3.2) : 2)),
    maxOpacityDrop:homePage ? (compact ? .46 : .5) : .4
  };
  const selector=[
    '.work-list article','.works-image-grid > a','.works-index > a',
    '.news article','.press-card','.timeline article','.artist-cv article',
    '.series-entry','.series-hero figure','.artist-portrait,.image-carousel',
    '.home-image-break,.press-side-image,.artist-film',
    '.home .artist-detail,.home .press-layout',
    '.home .hero,.home .side-content,.home .donut-sequence__stage,.home .horizontal-image-ticker',
    '.work-variants','h1,h2,h3',
    '.related-works > div > a'
  ].join(',');
  let cards=[];

  let target=window.scrollY,current=window.scrollY,frame=0;
  const baseTransforms=new WeakMap();
  const collectCards=()=>{
    cards=[...document.querySelectorAll(selector)].filter(card=>{
      // News copy is always individually clear. Its containing card gets a
      // depth cue only once its bottom is almost leaving the viewport.
      if(homePage&&card.matches('.home #news article,.home #news h3,.home #news p,.home #news time'))return false;
      // On the desktop home page the independent glass panel is the single
      // depth surface. Its children must not scale a second time. Mobile keeps
      // its existing, unmodified composition.
      if(homePage&&!compact){
        if(card.closest('.side-content')&&!card.matches('.home .side-content'))return false;
        if(card.closest('.hero')&&!card.matches('.home .hero'))return false;
      }
      // News stays legible until its containing card itself approaches a
      // viewport edge; individual stories never receive their own blur pass.
      if(homePage&&card.matches('.home #news article,.home #news h3,.home #news p,.home #news time'))return false;
      return !(mobileHome&&card.matches('.home .side-content,.home .donut-sequence__stage,.home .horizontal-image-ticker'));
    });
    cards.forEach(card=>{
      if(!baseTransforms.has(card))baseTransforms.set(card,getComputedStyle(card).transform);
    });
  };
  collectCards();
  const maxScroll=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
  const clamp=value=>Math.max(0,Math.min(maxScroll(),value));
  const isInteractive=element=>element.closest('a,button,input,select,textarea,label,[contenteditable]');
  const render=()=>{
    frame=0;
    current+=(target-current)*settings.damping;
    if(Math.abs(target-current)<.1)current=target;
    const atPageEdge=target<2||target>maxScroll()-2;
    cards.forEach(card=>{
      // Keep nested typography clear while allowing its parent card to retain
      // the depth effect. This prevents headings and their cards from scaling
      // independently and overlapping.
      const nestedEditorialHeading=card.matches('h1,h2,h3')&&card.closest('.timeline,.news,.press-list');
      const keepClear=nestedEditorialHeading||
        (compact&&document.body.classList.contains('about-page')&&card.matches('.page h1'))||
        card.matches('.home .artist-detail h2')||
        (mobileHome&&card.matches('.hero h1,.artist-detail,.artist-detail h2'));
      if(atPageEdge||keepClear){
        const base=baseTransforms.get(card);
        card.style.setProperty('transform',base&&base!=='none'?base:'none','important');
        card.style.setProperty('filter','none','important');
        card.style.setProperty('opacity','1','important');
        return;
      }
      const rect=card.getBoundingClientRect();
      // Rect follows native scrolling; offset it toward the eased scroll position
      // so scaling and blur glide rather than jump with each wheel tick.
      const visualCenter=rect.top+rect.height*.5+(window.scrollY-current);
      let t=0;
      if(homePage){
        if(card.matches('.home #news > .side-content')){
          // Reading stays sharp from entry through the final item. The cue
          // appears only as the card enters from below or leaves above.
          const exitBand=innerHeight*.16;
          t=rect.top>innerHeight-exitBand?(rect.top-(innerHeight-exitBand))/exitBand:(rect.bottom<exitBand?(exitBand-rect.bottom)/exitBand:0);
        }else{
          const edge=innerHeight*settings.homeEdgeBand;
          const lowerEdge=innerHeight-edge;
          t=visualCenter<edge ? (edge-visualCenter)/edge : (visualCenter>lowerEdge ? (visualCenter-lowerEdge)/edge : 0);
        }
      }else{
        const center=innerHeight*.5;
        const range=innerHeight*settings.influence;
        const distance=Math.abs(visualCenter-center);
        if(distance>range*2.1)t=1;
        else t=distance/range;
      }
      t=Math.max(0,Math.min(1,t));
      const ease=t*t;
      const base=baseTransforms.get(card);
      card.style.setProperty('transform',(base&&base!=='none'?base+' ':'')+'scale('+(1-ease*settings.maxScaleDrop)+')','important');
      // On compact touch screens opacity keeps the depth cue without the
      // expensive GPU blur pass. Desktop retains the blur treatment.
      card.style.setProperty('filter',compact?'none':'blur('+(ease*settings.maxBlur)+'px)','important');
      card.style.setProperty('opacity',String(1-ease*settings.maxOpacityDrop),'important');
    });
    if(current!==target)frame=requestAnimationFrame(render);
  };
  const requestRender=()=>{if(!frame)frame=requestAnimationFrame(render)};
  addEventListener('scroll',()=>{
    target=clamp(window.scrollY);
    requestRender();
  },{passive:true});
  addEventListener('resize',()=>{target=clamp(target);current=clamp(current);requestRender();},{passive:true});
  document.body.classList.add('virtual-card-scroll');
  new MutationObserver(()=>{
    collectCards();
    requestRender();
  }).observe(document.body,{childList:true,subtree:true});
  requestRender();
})();


// Homepage Donut sequence: frame 32 is the resting composition.
(()=>{
  if(!document.body.classList.contains('home')||document.querySelector('.donut-sequence'))return;
  const series=document.querySelector('#series');if(!series)return;
  series.insertAdjacentHTML('afterend','<section id="donut-scroll" class="donut-sequence" aria-label="Donut sculpture sequence"><a class="donut-sequence__link" href="works/power-food.html" aria-label="Open Power Food work detail"><div class="donut-sequence__stage"><canvas aria-label="Donut sculpture sequence"></canvas><div class="donut-sequence__loading">Loading 0%</div></div></a></section>');
  const section=document.querySelector('.donut-sequence'),stage=section.querySelector('.donut-sequence__stage'),canvas=stage.querySelector('canvas'),context=canvas.getContext('2d'),loading=section.querySelector('.donut-sequence__loading');
  const indexes=Array.from({length:45},(_,i)=>i+1),frames=[],paths=indexes.map(i=>'assets/catalog/donut/frames/'+String(i).padStart(3,'0')+'.webp?v=4');
  let loaded=0,target=31,current=target,shown=-1,animationFrame=0,sequenceVisible=false;
  const render=force=>{const index=Math.max(0,Math.min(frames.length-1,Math.round(current))),image=frames[index];if(!image||(!force&&shown===index))return;shown=index;const w=canvas.width,h=canvas.height,scale=Math.min(w/image.naturalWidth,h/image.naturalHeight)*.936,dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;context.clearRect(0,0,w,h);context.drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh);};
  const resize=()=>{const ratio=Math.min(devicePixelRatio||1,2),box=stage.getBoundingClientRect();canvas.width=Math.max(1,Math.round(box.width*ratio));canvas.height=Math.max(1,Math.round(box.height*ratio));render(true);};
  const requestAnimation=()=>{if(sequenceVisible&&!animationFrame)animationFrame=requestAnimationFrame(animate);};
  const followPage=()=>{const resting=section.offsetTop+section.offsetHeight/2-innerHeight/2,span=Math.max(innerHeight*.52,section.offsetHeight*.27),position=scrollY-resting;if(position<=-span)target=0;else if(position<-.18*span)target=(position+span)/(.82*span)*31;else if(position<.08*span)target=31;else if(position<.26*span)target=31+(position-.08*span)/(.18*span)*4;else if(position<1.46*span)target=35+(position-.26*span)/(1.2*span)*9;else target=frames.length-1;requestAnimation();};
  const animate=()=>{animationFrame=0;current+=(target-current)*.16;if(Math.abs(target-current)<.012)current=target;const momentum=Math.max(-1,Math.min(1,(target-current)*.22));stage.style.setProperty('--donut-tilt-y',(momentum*3.2).toFixed(2)+'deg');stage.style.setProperty('--donut-tilt-x',(Math.abs(momentum)*1.15).toFixed(2)+'deg');render();if(current!==target)requestAnimation();};
  const begin=()=>{section.classList.add('is-ready');loading.remove();resize();followPage();addEventListener('resize',()=>{resize();followPage();},{passive:true});addEventListener('scroll',followPage,{passive:true});if('IntersectionObserver'in window)new IntersectionObserver(entries=>entries.forEach(entry=>{sequenceVisible=entry.isIntersecting;if(sequenceVisible){followPage();requestAnimation();}else{cancelAnimationFrame(animationFrame);animationFrame=0;}}),{threshold:0}).observe(section);else{sequenceVisible=true;requestAnimation();}};
  let preloadStarted=false;
  const preload=()=>{if(preloadStarted)return;preloadStarted=true;paths.forEach((source,index)=>{const image=new Image();image.decoding='async';const done=()=>{frames[index]=image;loaded+=1;loading.textContent='Loading '+Math.round(loaded/paths.length*100)+'%';if(loaded===paths.length)begin();};image.onload=done;image.onerror=done;image.src=source;});};
  // The Artist film owns the preceding download slot. Once it is ready to
  // play, the Donut frames may download without competing with it.
  if(document.body.dataset.artistFilmReady==='true')preload();
  else window.addEventListener('poren:artist-film-ready',preload,{once:true});
})();

// Full-site page transition. The animation remains absent from dedicated test
// pages, where the test-only controller owns the interaction.
(()=>{
  if(window.__porenPageTransition||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(location.pathname.includes('donut-transition-test')||location.pathname.includes('cylindrical-home-test'))return;
  window.__porenPageTransition=true;
  const overlay=document.createElement('div');
  overlay.className='page-donut-transition';
  overlay.setAttribute('aria-hidden','true');
  // Do not compete with page media for bandwidth. The transition movie is
  // fetched only after the visitor chooses to leave the page.
  overlay.innerHTML='<video muted playsinline preload="none" data-src="assets/media/donut-page-transition.mp4"></video>';
  document.documentElement.append(overlay);
  const video=overlay.querySelector('video');
  let transitioning=false;
  const sameDocument=url=>url.pathname===location.pathname&&url.search===location.search;
  const handleLink=link=>{
    if(!link||link.target==='_blank'||link.hasAttribute('download'))return false;
    const href=link.getAttribute('href')||'';
    if(href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('#'))return false;
    const url=new URL(link.href,location.href);
    // Returning to the homepage is immediate; the donut transition is only
    // used when moving between inner pages.
    if(url.pathname==='/'||/\/index\.html$/.test(url.pathname))return false;
    return url.origin===location.origin&&!sameDocument(url);
  };
  const play=()=>new Promise(resolve=>{
    let complete=false;
    const done=()=>{
      if(complete)return;
      complete=true;
      clearTimeout(fallback);
      video.onended=null;
      resolve();
    };
    const fallback=setTimeout(done,2800);
    video.onended=done;
    if(!video.src){
      video.src=video.dataset.src;
      video.load();
    }
    video.currentTime=0;
    const result=video.play();
    if(result)result.catch(()=>setTimeout(done,500));
  });
  window.porenNavigate=href=>{
    if(transitioning)return false;
    const url=new URL(href,location.href);
    if(url.origin!==location.origin||sameDocument(url))return false;
    transitioning=true;
    document.body.classList.add('page-transition-leaving');
    setTimeout(async()=>{
      overlay.classList.add('is-visible');
      await play();
      overlay.classList.add('is-done');
      setTimeout(()=>{location.href=url.href;},420);
    },420);
    return true;
  };
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!handleLink(link)||transitioning)return;
    event.preventDefault();
    window.porenNavigate(link.href);
  },true);
})();
// Mobile-only image loading states. They sit around the existing picture/srcset
// output and never replace its sources or responsive sizes.
(()=>{
  const mobile=matchMedia('(max-width: 47.9375rem)');
  const setup=()=>{
    // Mobile artwork loading deliberately uses the page's white background.
    // No skeleton wrapper is added, so existing picture/srcset choices remain intact.
    return;
    if(!mobile.matches)return;
    document.querySelectorAll('.works-image-grid figure img,.work-gallery figure img,.related-works figure img,.work-list figure img').forEach(img=>{
      const shell=img.closest('figure');
      if(!shell||shell.dataset.mobileImageState)return;
      shell.dataset.mobileImageState='pending';
      shell.classList.add('mobile-image-shell');
      const reveal=()=>{
        shell.classList.add('is-mobile-image-ready');
        shell.dataset.mobileImageState='ready';
      };
      if(img.complete&&img.naturalWidth)reveal();
      else img.addEventListener('load',reveal,{once:true});
      img.addEventListener('error',reveal,{once:true});
    });
  };
  setup();
  mobile.addEventListener?.('change',setup);
})();

// Fixed scroll walker. The horizontal position is derived from actual page
// progress, so scrolling up retraces the same route as scrolling down.
(()=>{
  if(window.__porenScrollWalker)return;
  window.__porenScrollWalker=true;
  const walkerStyle=document.createElement('style');
  walkerStyle.textContent='.scroll-walker{position:fixed!important;z-index:20001!important;left:0!important;bottom:max(24px,calc(env(safe-area-inset-bottom) + 16px))!important;width:12vh!important;height:12vh!important;min-width:72px!important;min-height:72px!important;max-width:168px!important;max-height:168px!important;pointer-events:none!important;will-change:transform!important;transition:opacity .3s ease,visibility 0s linear 0s!important}.intro-active .scroll-walker{opacity:0!important;visibility:hidden!important}.scroll-walker__idle,.scroll-walker__walk,.scroll-walker__walk-image{display:block;width:100%;height:100%;object-fit:contain}.scroll-walker__walk,.scroll-walker__walk-image{display:none!important}.scroll-walker__canvas{display:none!important}.scroll-walker.is-walking .scroll-walker__walk.is-active{display:block!important}.scroll-walker.is-walking .scroll-walker__idle{display:none}.scroll-walker.is-alpha-walker .scroll-walker__walk{display:none!important}.scroll-walker.is-alpha-walker.is-walking .scroll-walker__walk-image{display:block!important}body.home #artist>.side-content{position:relative!important;left:var(--artist-screen-offset,0px)!important}@media(max-width:700px){.scroll-walker{width:10.8vh!important;height:10.8vh!important;max-width:151px!important;max-height:151px!important}body.home #press>.side-content{zoom:1!important}body.home #press .press-layout{display:flex!important;flex-direction:column!important;gap:4rem!important}body.home #press .press-side-image{display:block!important;position:static!important;width:100%!important;aspect-ratio:1 / 1!important;order:1!important;margin:0!important}body.home #press .press-list{display:block!important;order:2!important;margin:0!important}body.home #artist .artist-detail>div{padding-left:0!important;padding-right:0!important;text-align:center!important}body.home #artist .artist-detail h2{font-size:clamp(1.4rem,6.3vw,1.72rem)!important;line-height:1.18!important;text-align:center!important}body.home #artist .artist-detail>div p{font-size:.82rem!important;line-height:1.65!important;text-align:center!important}}@media(prefers-reduced-motion:reduce){.scroll-walker__canvas{display:none!important}.scroll-walker__idle{display:block!important}}';
  document.head.append(walkerStyle);
  // This runtime walker stylesheet is appended after the main stylesheet.
  // Keep its mobile Press fallback centred and reserve clear reading space below it.
  const walkerPressLayoutStyle=document.createElement('style');
  walkerPressLayoutStyle.textContent='@media(max-width:700px){body.home #press .press-layout{display:flex!important;flex-direction:column!important}body.home #press .press-side-image{margin:0 auto!important;aspect-ratio:auto!important;height:auto!important;max-height:none!important;overflow:visible!important}body.home #press .press-side-image img{display:block!important;width:100%!important;height:auto!important;object-fit:contain!important}body.home #press .press-list{margin:var(--space-7) 0 0!important}}';
  document.head.append(walkerPressLayoutStyle);
  const walker=document.createElement('div');
  walker.className='scroll-walker';
  walker.setAttribute('aria-hidden','true');
  walker.innerHTML='<img class="scroll-walker__idle" data-src="assets/media/scroll-character-idle-512.webp" alt=""><img class="scroll-walker__walk-image" data-right-src="assets/media/scroll-character-right-alpha.webp" data-left-src="assets/media/scroll-character-left-alpha.webp" alt=""><canvas class="scroll-walker__canvas"></canvas><video class="scroll-walker__walk scroll-walker__walk--right" muted playsinline loop preload="none" data-src="assets/media/scroll-character-right-transparent.webm"></video><video class="scroll-walker__walk scroll-walker__walk--left" muted playsinline loop preload="none" data-src="assets/media/scroll-character-left-transparent.webm"></video>';
  document.body.append(walker);
  const idle=walker.querySelector('.scroll-walker__idle');
  const walkImage=walker.querySelector('.scroll-walker__walk-image');
  const canvas=walker.querySelector('.scroll-walker__canvas');
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const videos={right:walker.querySelector('.scroll-walker__walk--right'),left:walker.querySelector('.scroll-walker__walk--left')};
  const compact=matchMedia('(max-width:700px)');
  const warmWalkerMedia=()=>{
    if(walker.dataset.mediaReady)return;
    walker.dataset.mediaReady='true';
    idle.src=idle.dataset.src;
    if(compact.matches)walkImage.src=walkImage.dataset.rightSrc;
    else Object.values(videos).forEach(video=>{video.innerHTML=`<source src="${video.dataset.src}" type="video/webm">`;video.preload='metadata';video.load();});
  };
  // Fetch the lower walker alongside the first banner film. It remains hidden
  // until the opening completes, so its visual behaviour does not change.
  if(document.body.dataset.heroMediaStarted==='true')warmWalkerMedia();
  else window.addEventListener('poren:hero-media-start',warmWalkerMedia,{once:true});
  let position=0,targetPosition=0,direction='',stopTimer=0,positionFrame=0,videoFrame=0,videoVideoFrame=0,activeVideo=null,pageScrollRange=1;
  const scheduleWalkVideoFrame=()=>{
    if(!activeVideo)return;
    if('requestVideoFrameCallback' in activeVideo)videoVideoFrame=activeVideo.requestVideoFrameCallback(renderVideo);
    else videoFrame=requestAnimationFrame(renderVideo);
  };
  const characterWidth=()=>walker.getBoundingClientRect().width||innerHeight*.12;
  const travelBounds=()=>{
    // Use the complete viewport rather than clientWidth (which excludes the
    // scrollbar). This makes the visible left and right margins identical.
    const available=Math.max(0,innerWidth-characterWidth());
    // Keep the route centred. Desktop was already an 84% lane; both routes
    // now travel 15% less while retaining identical left/right margins.
    const lane=available*(compact.matches?.85:(.84*.85));
    const start=(available-lane)/2;
    return {start,end:start+lane};
  };
  const clamp=value=>{const bounds=travelBounds();return Math.max(bounds.start,Math.min(bounds.end,value));};
  const measurePageRoute=()=>{
    pageScrollRange=Math.max(1,Math.round(document.documentElement.scrollHeight-innerHeight));
    document.documentElement.dataset.walkerScrollRange=String(pageScrollRange);
    return pageScrollRange;
  };
  const pageProgress=()=>Math.max(0,Math.min(1,scrollY/pageScrollRange));
  const place=()=>{position=clamp(position);targetPosition=clamp(targetPosition);walker.style.transform='translate3d('+position+'px,0,0)';};
  const easePosition=()=>{
    position+=(targetPosition-position)*.12;
    if(Math.abs(targetPosition-position)>.25)positionFrame=requestAnimationFrame(easePosition);
    else {position=targetPosition;positionFrame=0;}
    place();
  };
  const moveTo=next=>{targetPosition=clamp(next);if(!positionFrame)positionFrame=requestAnimationFrame(easePosition);};
  const renderVideo=()=>{
    if(!activeVideo||activeVideo.paused)return;
    const sourceWidth=activeVideo.videoWidth,sourceHeight=activeVideo.videoHeight;
    if(sourceWidth&&sourceHeight){
      // Match the canvas backing store to high-density displays so the fixed
      // scroll character stays sharp at its existing visual size.
      const renderedHeight=walker.getBoundingClientRect().height||168;
      const height=Math.min(720,Math.max(480,Math.round(renderedHeight*Math.min(3,devicePixelRatio||1)*1.5))),width=Math.max(1,Math.round(height*sourceWidth/sourceHeight));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      context.imageSmoothingEnabled=true;
      context.imageSmoothingQuality='high';
      context.clearRect(0,0,width,height);
      context.drawImage(activeVideo,0,0,width,height);
      const frame=context.getImageData(0,0,width,height),pixels=frame.data;
      for(let index=0;index<pixels.length;index+=4){
        if(Math.min(pixels[index],pixels[index+1],pixels[index+2])>225){pixels[index+3]=0;continue;}
        if(Math.max(pixels[index],pixels[index+1],pixels[index+2])>75){pixels[index]=198;pixels[index+1]=255;pixels[index+2]=52;}
      }
      context.putImageData(frame,0,0);
    }
    scheduleWalkVideoFrame();
  };
  const stop=()=>{
    direction='';walker.classList.remove('is-walking','is-left','is-right');idle.hidden=false;
    cancelAnimationFrame(positionFrame);positionFrame=0;
    const bounds=travelBounds(),atEnd=Math.abs(targetPosition-bounds.start)<.25||Math.abs(targetPosition-bounds.end)<.25;
    if(atEnd)position=targetPosition;else targetPosition=position;
    place();cancelAnimationFrame(videoFrame);activeVideo?.cancelVideoFrameCallback?.(videoVideoFrame);activeVideo=null;
    Object.values(videos).forEach(video=>{video.pause();video.currentTime=0;});
  };
  const walk=nextDirection=>{
    warmWalkerMedia();
    if(direction!==nextDirection){
      direction=nextDirection;walker.classList.toggle('is-left',nextDirection==='left');walker.classList.toggle('is-right',nextDirection==='right');walker.classList.add('is-walking');idle.hidden=true;
      const useAlphaWalker=compact.matches;
      walker.classList.toggle('is-alpha-walker',useAlphaWalker);
      if(useAlphaWalker){
        walkImage.src=walkImage.dataset[nextDirection==='left'?'leftSrc':'rightSrc'];
        activeVideo=null;
        Object.values(videos).forEach(video=>{video.pause();video.currentTime=0;video.classList.remove('is-active');});
      }else{
        const current=videos[nextDirection],other=videos[nextDirection==='left'?'right':'left'];
        other.pause();other.currentTime=0;current.currentTime=0;current.playbackRate=.72;activeVideo=current;
        Object.values(videos).forEach(video=>video.classList.toggle('is-active',video===current));
        cancelAnimationFrame(videoFrame);activeVideo?.cancelVideoFrameCallback?.(videoVideoFrame);current.play().catch(()=>{});
      }
    }
    clearTimeout(stopTimer);
    stopTimer=setTimeout(stop,220);
  };
  const syncToPageProgress=()=>{
    const bounds=travelBounds(),destination=bounds.start+(bounds.end-bounds.start)*pageProgress();
    if(Math.abs(destination-position)<.5){position=destination;targetPosition=destination;place();return;}
    walk(destination>position?'right':'left');moveTo(destination);
  };
  const recordSectionPositions=()=>{
    if(compact.matches)return;
    const limit=measurePageRoute(),bounds=travelBounds(),records={};
    document.querySelectorAll('.home-section-nav a').forEach(link=>{
      const selector=link.getAttribute('href'),section=selector==='#top'?null:document.querySelector(selector);
      const screenY=section?Math.min(limit,Math.max(0,section.getBoundingClientRect().top+scrollY)):0;
      const x=bounds.start+(bounds.end-bounds.start)*(screenY/limit);
      records[selector]={screenY:Math.round(screenY),characterX:Math.round(x)};
      link.dataset.walkerPosition=String(Math.round(x));
      link.dataset.walkerScrollY=String(Math.round(screenY));
    });
    window.__porenWalkerSectionPositions=records;
  };
  const centerArtistOnViewport=()=>{
    const content=document.querySelector('body.home #artist > .side-content');
    if(!content)return;
    content.style.setProperty('--artist-screen-offset','0px');
    const rect=content.getBoundingClientRect();
    const correction=innerWidth/2-(rect.left+rect.width/2);
    content.style.setProperty('--artist-screen-offset',Math.round(correction*100)/100+'px');
  };
  let calibrationFrame=0;
  const recalibrateRoute=()=>{
    cancelAnimationFrame(calibrationFrame);
    calibrationFrame=requestAnimationFrame(()=>{
      calibrationFrame=0;
      measurePageRoute();
      centerArtistOnViewport();
      syncToPageProgress();
      recordSectionPositions();
    });
  };
  addEventListener('wheel',event=>{
    if(!event.deltaY||event.target.closest?.('.work-stage,.horizontal-image-ticker'))return;
    const amount=event.deltaMode===1?event.deltaY*16:event.deltaMode===2?event.deltaY*innerHeight:event.deltaY;
    const limit=pageScrollRange,atBottom=amount>0&&scrollY>=limit-2,atTop=amount<0&&scrollY<=2;
    if(atBottom||atTop){const bounds=travelBounds(),destination=atBottom?bounds.end:bounds.start;targetPosition=destination;if(Math.abs(position-destination)<.5){position=destination;place();}walk(atBottom?'right':'left');return;}
    walk(amount>0?'right':'left');
  },{passive:true,capture:true});
  let walkerScrollFrame=0;
  const queueWalkerScroll=()=>{
    if(walkerScrollFrame)return;
    walkerScrollFrame=requestAnimationFrame(()=>{walkerScrollFrame=0;syncToPageProgress();});
  };
  addEventListener('scroll',queueWalkerScroll,{passive:true});
  addEventListener('resize',()=>{place();recalibrateRoute();},{passive:true});
  addEventListener('poren:section-select',()=>{if(!compact.matches)recalibrateRoute();});
  measurePageRoute();position=travelBounds().start;targetPosition=position;place();centerArtistOnViewport();recordSectionPositions();
  document.fonts?.ready.then(recalibrateRoute);
  document.querySelectorAll('img,video').forEach(media=>{
    media.addEventListener('load',recalibrateRoute,{once:true});
    media.addEventListener('loadedmetadata',recalibrateRoute,{once:true});
  });
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(recalibrateRoute);
    observer.observe(document.body);
  }
})();
