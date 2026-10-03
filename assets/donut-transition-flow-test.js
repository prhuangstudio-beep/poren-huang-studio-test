(()=>{
  if(window.__porenDonutTransition)return;
  window.__porenDonutTransition=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  const active=new URLSearchParams(location.search).has('donutTest')||location.pathname.includes('donut-transition-test')||location.pathname.includes('cylindrical-home-test');
  if(!active)return;

  document.body.classList.add('donut-transition-ready');
  requestAnimationFrame(()=>document.body.classList.add('donut-transition-in'));

  const overlay=document.createElement('div');
  overlay.className='donut-page-transition';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<video muted playsinline preload="auto" src="assets/media/donut-page-transition.mp4"></video>';
  document.documentElement.append(overlay);

  const video=overlay.querySelector('video');
  let transitioning=false;
  const isSamePageHash=url=>url.pathname===location.pathname&&url.search===location.search&&url.hash;
  const shouldHandle=link=>{
    if(!link||link.target==='_blank'||link.hasAttribute('download'))return false;
    const href=link.getAttribute('href')||'';
    if(href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('#'))return false;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||isSamePageHash(url))return false;
    return true;
  };

  const withTestParam=url=>{
    url.searchParams.set('donutTest','1');
    return url;
  };

  const finish=url=>{
    overlay.classList.add('is-done');
    setTimeout(()=>{location.href=url.href;},480);
  };

  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(!shouldHandle(link)||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(transitioning)return;
    transitioning=true;
    const url=withTestParam(new URL(link.href,location.href));
    document.body.classList.add('donut-transition-leaving');
    setTimeout(()=>{
      overlay.classList.add('is-visible');
      overlay.classList.remove('is-done');
      video.currentTime=0;
      const fallback=setTimeout(()=>finish(url),1800);
      video.onended=()=>{
        clearTimeout(fallback);
        finish(url);
      };
      video.play().catch(()=>{
        clearTimeout(fallback);
        setTimeout(()=>finish(url),900);
      });
    },540);
  },true);
})();
