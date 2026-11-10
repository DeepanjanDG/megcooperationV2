(function () {
  var ALBUMS = [
    { id:'training_rocs', title:'Training on online registration of cooperative societies', note:'Conducted by the National Informatics Centre, Meghalaya', cover:'photogallery/12.jpeg', dir:'photogallery/training_rocs/', ext:'.jpeg', count:14 },
    { id:'coop_week_66', title:'66th All India Cooperative Week, 2019', note:'Celebrations across the state', cover:'photogallery/11.jpg', dir:'photogallery/66th_coop_week_2019/', ext:'.jpg', count:17 },
    { id:'sial_innovation', title:'SIAL Innovation, New Delhi', note:'Meghalaya cooperatives at the SIAL exhibition', cover:'photogallery/10.jpg', dir:'photogallery/sial_innovation/', ext:'.jpg', count:13 },
    { id:'flp_mupliang', title:'Financial Literacy Programme, Mupliang', note:'', cover:'photogallery/9.jpg', dir:'photogallery/flp_mupliang/', ext:'.jpg', count:5 },
    { id:'field_visit', title:'Field visit by the Principal Secretary and the Commissioner and Secretary', note:'Department of Cooperation', cover:'photogallery/8.jpg', dir:'photogallery/field_visit/', ext:'.jpg', count:5 },
    { id:'mou_nabard', title:'Signing of the MoU with NABARD', note:'Between the Department of Cooperation and NABARD', cover:'photogallery/1.jpg', dir:'photogallery/mou_nabard/', ext:'.jpg', count:8 },
    { id:'motivational_mawkyrwat', title:'Motivational and awareness programme, Mawkyrwat', note:'', cover:'photogallery/2.jpg', dir:'photogallery/motivational_mawkyrwat/', ext:'.jpg', count:9 },
    { id:'mecofed', title:'MECOFED', note:'Meghalaya State Cooperative Marketing and Consumers’ Federation Ltd', cover:'photogallery/3.jpg', dir:'photogallery/mecofed/', ext:'.jpg', count:7 },
    { id:'damas_rubber', title:'Damas Rubber Growers cum Processing Cooperative Society', note:'', cover:'photogallery/4.jpg', dir:'photogallery/damas_rubber/', ext:'.jpg', count:8 },
    { id:'motivational_amlarem', title:'Motivational and awareness programme, Amlarem', note:'', cover:'photogallery/5.jpg', dir:'photogallery/motivational_amlarem/', ext:'.jpg', count:9 },
    { id:'women_mawkyndeng', title:'Mawkyndeng Multipurpose Cooperative Society', note:'Women’s group and handicraft society', cover:'photogallery/6.jpg', dir:'photogallery/women_mawkyndeng/', ext:'.jpg', count:9 },
    { id:'icdp_wkh', title:'ICDP, West Khasi Hills District', note:'Integrated Cooperative Development Project', cover:'photogallery/7.jpg', dir:'photogallery/icdp_wkh/', ext:'.jpg', count:15 },
    { id:'mmcs_services', title:'Mendipathar Multipurpose Cooperative Society Ltd.', note:'Services, products and training, East Garo Hills', cover:'photogallery/mmcs_services/1.jpg', dir:'photogallery/mmcs_services/', ext:'.jpg', count:30 },
    { id:'mmcs_ginger', title:'Development Workshop on Ginger, Mendipathar', note:'5 September 2006, sponsored by NABARD', cover:'photogallery/mmcs_ginger/1.jpg', dir:'photogallery/mmcs_ginger/', ext:'.jpg', count:12 },
    { id:'mmcs_skills', title:'Skills training for self-help groups, Mendipathar', note:'September 2005, income generation project', cover:'photogallery/mmcs_skills/1.jpg', dir:'photogallery/mmcs_skills/', ext:'.jpg', count:27 },
    { id:'mmcs_showroom', title:'Showroom inauguration, Mendipathar', note:'27 March 2006, inaugurated by the Governor of Meghalaya', cover:'photogallery/mmcs_showroom/1.jpg', dir:'photogallery/mmcs_showroom/', ext:'.jpg', count:18 },
    { id:'uaics', title:'Umklai Area Integrated Cooperative Society Ltd.', note:'Products and activities of the society', cover:'photogallery/uaics/1.jpg', dir:'photogallery/uaics/', ext:'.jpg', count:10 },
    { id:'netf_2005', title:'North East Trade Fair 2005, New Delhi', note:'Cooperative stalls, including the Meghalaya Apex Handloom Weavers and Handicrafts Cooperative Federation Ltd.', cover:'photogallery/netf_2005/1.jpg', dir:'photogallery/netf_2005/', ext:'.jpg', count:5 },
    { id:'nvmce', title:'New Vistas in Managing Co-operative Enterprises', note:'Training for officers of the Cooperation Department, 16 to 19 October 2006', cover:'photogallery/nvmce/1.jpg', dir:'photogallery/nvmce/', ext:'.jpg', count:5 },
    { id:'unnwwcs', title:'Upper New Nongstoin Women Weaving Cooperative Society Ltd.', note:'', cover:'photogallery/unnwwcs/1.jpg', dir:'photogallery/unnwwcs/', ext:'.jpg', count:2 },
    { id:'coop_products', title:'Cooperative enterprises and products', note:'Honey, cashew, handloom, piggery, poultry, consumer store and handicrafts', cover:'photogallery/coop_products/1.jpg', dir:'photogallery/coop_products/', ext:'.jpg', count:24 },
    { id:'coop_at_work', title:'Cooperative societies at work', note:'Food processing, horticulture, a consumer store and dairy', cover:'photogallery/coop_at_work/1.jpg', dir:'photogallery/coop_at_work/', ext:'.jpg', count:5 }
  ];

  var indexEl   = document.getElementById('gal-index');
  var albumEl   = document.getElementById('gal-album');
  var albumsEl  = document.getElementById('gal-albums');
  var thumbsEl  = document.getElementById('gal-thumbs');
  var titleEl   = document.getElementById('gal-album-title');
  var countEl   = document.getElementById('gal-album-count');
  var backEl    = document.getElementById('gal-back');

  var lb        = document.getElementById('lb');
  var lbImg     = document.getElementById('lb-img');
  var lbCap     = document.getElementById('lb-cap');
  var lbCounter = document.getElementById('lb-counter');

  var current = null, idx = 0, lastFocus = null;

  /* Covers and thumbnails load from photogallery/thumbs/ (same name, .jpg);
     add a thumbnail there for every new photo. */
  function thumbOf(p) {
    return p.replace(/^photogallery\//, 'photogallery/thumbs/').replace(/\.[A-Za-z]+$/, '.jpg');
  }

  function shots(a) {
    var out = [];
    for (var i = 1; i <= a.count; i++) out.push(a.dir + i + a.ext);
    return out;
  }

  ALBUMS.forEach(function (a) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'album';
    b.innerHTML =
      '<img src="' + thumbOf(a.cover) + '" alt="" loading="lazy">' +
      '<span class="meta"><span class="a-title">' + a.title + '</span>' +
      '<span class="a-count">' + a.count + ' photograph' + (a.count === 1 ? '' : 's') +
      (a.note ? ' &middot; ' + a.note : '') + '</span></span>';
    b.addEventListener('click', function () { openAlbum(a); });
    albumsEl.appendChild(b);
  });

  function openAlbum(a) {
    current = a;
    titleEl.textContent = a.title;
    countEl.textContent = a.count + ' photograph' + (a.count === 1 ? '' : 's') + (a.note ? ' — ' + a.note : '');
    thumbsEl.innerHTML = '';
    shots(a).forEach(function (src, i) {
      var t = document.createElement('button');
      t.type = 'button';
      t.setAttribute('aria-label', 'View photograph ' + (i + 1) + ' of ' + a.count);
      t.innerHTML = '<img src="' + thumbOf(src) + '" alt="" loading="lazy">';
      t.addEventListener('click', function () { openLb(i, t); });
      thumbsEl.appendChild(t);
    });
    indexEl.hidden = true;
    albumEl.hidden = false;
    titleEl.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backEl.addEventListener('click', function () {
    albumEl.hidden = true;
    indexEl.hidden = false;
    current = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function openLb(i, origin) {
    if (!current) return;
    lastFocus = origin || document.activeElement;
    idx = i;
    render();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.getElementById('lb-close').focus();
  }

  function render() {
    var list = shots(current);
    lbImg.src = list[idx];
    lbImg.alt = current.title + ', photograph ' + (idx + 1);
    lbCap.textContent = current.title;
    lbCounter.textContent = (idx + 1) + ' of ' + list.length;
  }

  function step(d) {
    var n = current.count;
    idx = (idx + d + n) % n;
    render();
  }

  function closeLb() {
    lb.classList.remove('is-open');
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.getElementById('lb-prev').addEventListener('click', function () { step(-1); });
  document.getElementById('lb-next').addEventListener('click', function () { step(1); });
  document.getElementById('lb-close').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();
