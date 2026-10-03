(()=>{
  const fitTitle=()=>{
    const title=document.querySelector('.work-detail-info .work-heading h1');
    if(!title)return;
    title.style.fontSize='';
    let size=parseFloat(getComputedStyle(title).fontSize);
    while(title.scrollWidth>title.clientWidth&&size>18){size-=1;title.style.fontSize=size+'px'}
  };
  const setMediaCover=container=>{
    const img=container.querySelector('img');
    if(!img)return;
    const apply=()=>container.style.setProperty('--cover-image','url("'+img.src+'")');
    img.complete?apply():img.addEventListener('load',apply,{once:true});
  };
  const mainFigure=document.querySelector('.work-main');
  let main=mainFigure?.querySelector('img');
  let switchingImage=false;
  const thumbnails=[...document.querySelectorAll('.work-thumbnails button')];
  const showImage=index=>{
    const button=thumbnails[index];
    if(!button||!main||!mainFigure||switchingImage)return;
    const nextPicture=button.querySelector('picture');
    const nextImage=nextPicture?.querySelector('img');
    if(!nextImage)return;
    if(main.currentSrc===nextImage.currentSrc||main.src===nextImage.src){
      thumbnails.forEach(item=>item.classList.toggle('active',item===button));
      button.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
      return;
    }
    switchingImage=true;
    const currentPicture=mainFigure.querySelector('picture');
    const replacement=nextPicture.cloneNode(true);
    const replacementImage=replacement.querySelector('img');
    replacementImage.loading='eager';
    replacement.style.cssText='position:absolute;inset:0;display:block;opacity:0;transition:opacity 220ms ease';
    const reveal=()=>{
      requestAnimationFrame(()=>{
        replacement.style.opacity='1';
        if(currentPicture)currentPicture.style.opacity='0';
        setTimeout(()=>{
          mainFigure.replaceChildren(replacement);
          replacement.style.cssText='';
          main=replacement.querySelector('img');
          thumbnails.forEach(item=>item.classList.toggle('active',item===button));
          button.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
          switchingImage=false;
        },230);
      });
    };
    mainFigure.append(replacement);
    if(replacementImage.complete)reveal();
    else {
      replacementImage.addEventListener('load',reveal,{once:true});
      replacementImage.addEventListener('error',()=>{replacement.remove();switchingImage=false},{once:true});
    }
  };
  thumbnails.forEach((button,index)=>button.addEventListener('click',()=>showImage(index)));
  if(mainFigure&&thumbnails.length>1){
    let startX=0;
    let deltaX=0;
    let dragging=false;
    const currentIndex=()=>Math.max(0,thumbnails.findIndex(button=>button.classList.contains('active')));
    const resetCard=()=>{
      const picture=mainFigure.querySelector('picture');
      if(picture){picture.style.transform='none';picture.style.transition='none'}
    };
    mainFigure.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse')return;
      startX=event.clientX;
      deltaX=0;
      dragging=true;
      mainFigure.setPointerCapture?.(event.pointerId);
    });
    mainFigure.addEventListener('pointermove',event=>{
      if(!dragging)return;
      deltaX=event.clientX-startX;
      // The chosen image stays at its natural scale while swiping; only the
      // selected thumbnail changes after the gesture completes.
    });
    const finishSwipe=()=>{
      if(!dragging)return;
      dragging=false;
      resetCard();
      if(Math.abs(deltaX)<48)return;
      const direction=deltaX<0?1:-1;
      const next=(currentIndex()+direction+thumbnails.length)%thumbnails.length;
      showImage(next);
    };
    mainFigure.addEventListener('pointerup',finishSwipe);
    mainFigure.addEventListener('pointercancel',finishSwipe);

    // On desktop, the gallery changes image with the mouse wheel while hovered.
    const finePointer=window.matchMedia('(hover:hover) and (pointer:fine)');
    let wheelLocked=false;
    mainFigure.addEventListener('wheel',event=>{
      if(!finePointer.matches||Math.abs(event.deltaY)<2)return;
      event.preventDefault();
      if(wheelLocked||switchingImage)return;
      wheelLocked=true;
      const direction=event.deltaY>0?1:-1;
      const next=(currentIndex()+direction+thumbnails.length)%thumbnails.length;
      showImage(next);
      window.setTimeout(()=>{wheelLocked=false},380);
    },{passive:false});
  }
  document.querySelector('.concept-toggle')?.addEventListener('click',event=>{
    const button=event.currentTarget;
    const copy=button.nextElementSibling;
    const expanded=button.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',String(!expanded));
    if(copy)copy.hidden=expanded;
  });
  document.querySelectorAll('.square-media,.work-variants a,.image-carousel').forEach(setMediaCover);
  fitTitle();
  window.addEventListener('resize',fitTitle,{passive:true});
})();
