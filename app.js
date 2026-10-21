const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cfg=window.BABA_SITE_CONFIG||{};
const RATTIS=Array.from({length:12},(_,i)=>i+4);
let activeCategory="All", query="", visibleCount=18;
let wishlist=JSON.parse(localStorage.getItem("baba_gems_wishlist")||"[]");
let cart=JSON.parse(localStorage.getItem("baba_gems_cart")||"[]");
let toastTimer=null;
const fmt=n=>"₹"+Math.round(Number(n)||0).toLocaleString("en-IN");
const allProducts=window.BABA_PRODUCTS||[];
const allNavratna=window.BABA_NAVRATNA||[];
function priceAtWeight(p,ratti){return Math.round((p.price4||1000)*Number(ratti||4)/4);}
function absoluteAssetUrl(path){return new URL(path, window.location.href).href;}
function productPageUrl(p){const base=window.location.href.split('#')[0];return allProducts.some(x=>x.id===p.id)?`${base}#product-${encodeURIComponent(p.id)}`:`${base}#navratna`;}
function productImageUrl(p){return absoluteAssetUrl(getImage(p));}
function safe(s){return String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function handleImageError(img){
  if(!img || img.dataset.didFallback === "1"){
    if(img){img.style.display="none";const fallback=img.nextElementSibling;if(fallback){fallback.style.display=fallback.classList.contains("gem-placeholder")?"grid":"flex";}}
    return;
  }
  const fallbackSrc=img.dataset.fallbackSrc;
  if(fallbackSrc){img.dataset.didFallback="1";img.src=fallbackSrc;return;}
  img.dataset.didFallback="1";img.style.display="none";
  const fallback=img.nextElementSibling;if(fallback){fallback.style.display=fallback.classList.contains("gem-placeholder")?"grid":"flex";}
}
function rattiOptions(selected=4){return RATTIS.map(n=>`<option value="${n}" ${Number(selected)===n?"selected":""}>${n} Ratti</option>`).join("");}
function toast(message, detail=""){const t=$("#toast");t.innerHTML=`<span class="tick">✓</span><span><b>${safe(message)}</b>${detail?`<br><small>${safe(detail)}</small>`:""}</span>`;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2700);}
function renderNavratna(){
  $("#navratnaGrid").innerHTML=allNavratna.map(p=>{
    const image=`assets/products/${safe(p.imageFile || `${p.sku}.png`)}`;
    return `<article class="navratna-card" data-navcard="${safe(p.name)}">
      <div class="navratna-img-wrap"><img src="${image}" alt="Illustrative ${safe(p.name)} gemstone artwork" loading="lazy" onerror="this.style.display='none'"></div>
      <div class="navratna-name">${safe(p.name)}</div><div class="navratna-hindi">${safe(p.hindi)} · ${safe(p.planet)}</div>
      <select class="weight-select" aria-label="${safe(p.name)} ratti weight" data-weight="${p.id||p.sku}">${rattiOptions(4)}</select>
      <div class="navratna-price" data-price-for="${p.sku}">${fmt(p.price4)} <small>/ 4 Ratti · sample price</small></div>
      <button class="add-btn" data-add-nav="${p.sku}">Add to Cart</button>
    </article>`;
  }).join("");
}
function getImage(p){
  if(!p) return "";
  const filename=(p.imageFile || `${p.sku || p.id || ""}.png`);
  return filename && filename!==".png" ? `assets/products/${filename}` : "";
}
function productImage(p){
  const img=getImage(p);
  return `<div class="product-image" data-detail="${safe(p.id)}">
    <img src="${safe(img)}" alt="Illustrative artwork for ${safe(p.name)}" loading="lazy" onerror="this.style.display='none'">
    <span class="product-badge">${safe(p.category)} · SAMPLE</span>
    <button class="wish-btn ${wishlist.includes(p.id)?"active":""}" data-wish="${safe(p.id)}" aria-label="Add ${safe(p.name)} to wishlist">${wishlist.includes(p.id)?"♥":"♡"}</button>
  </div>`;
}

function filteredProducts(){
 let list=allProducts.filter(p=>(activeCategory==="All"||p.category===activeCategory)&&(!query||`${p.name} ${p.stone} ${p.category} ${p.sku} ${p.origin||""}`.toLowerCase().includes(query.toLowerCase())));
 const min=Number($("#minPrice").value)||0, max=Number($("#maxPrice").value)||Infinity;
 list=list.filter(p=>priceAtWeight(p,4)>=min&&priceAtWeight(p,4)<=max);
 const sort=$("#sort").value;
 if(sort==="low")list.sort((a,b)=>a.price4-b.price4);
 else if(sort==="high")list.sort((a,b)=>b.price4-a.price4);
 else if(sort==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
 return list;
}
function renderProducts(){
 const list=filteredProducts();
 $("#resultCount").textContent=`Showing ${Math.min(visibleCount,list.length)} of ${list.length} products`;
 $("#productGrid").innerHTML=list.slice(0,visibleCount).map(p=>`<article class="product-card" id="product-${safe(p.id)}" data-product="${safe(p.id)}">
   ${productImage(p)}
   <div class="product-info"><div class="product-title">${safe(p.name)}</div>
   <div class="product-meta">SKU: ${safe(p.sku)} · ${safe(p.origin||"Origin varies")}</div>
   <div class="product-price" data-card-price="${safe(p.id)}">${fmt(priceAtWeight(p,4))}<span class="range">${fmt(priceAtWeight(p,4))} – ${fmt(priceAtWeight(p,15))} · 4–15 Ratti</span></div>
   <div class="weight-row"><label for="w-${safe(p.id)}">Choose gemstone weight</label><select id="w-${safe(p.id)}" class="product-weight" data-product-weight="${safe(p.id)}">${rattiOptions(4)}</select></div>
   <div class="product-actions"><button class="add-btn" data-add="${safe(p.id)}">Add to Cart</button></div></div>
 </article>`).join("")||'<div class="empty-state">No products found. Try a different search or category.</div>';
 $("#loadMore").style.display=visibleCount<list.length?"inline-flex":"none";
 updateCounts();
}
function updateCounts(){
 const wc=$("#wishlistCount"); if(wc)wc.textContent=wishlist.length;
 const cc=$("#cartCount"); if(cc)cc.textContent=cart.reduce((n,x)=>n+x.qty,0);
 localStorage.setItem("baba_gems_wishlist",JSON.stringify(wishlist));
 localStorage.setItem("baba_gems_cart",JSON.stringify(cart));
}
function addToCart(id,ratti=4){
 const p=findAnyProduct(id); if(!p){toast("Product unavailable");return;}
 const key=String(id)+"-"+Number(ratti); const existing=cart.find(x=>x.key===key);
 if(existing)existing.qty+=1; else cart.push({key,id:String(id),ratti:Number(ratti),qty:1});
 updateCounts(); renderCart(); toast("Added to cart",p.name+" · "+ratti+" Ratti");
}
function cartProduct(item){return findAnyProduct(item.id);}
function renderCart(){
 const host=$("#cartItems"); if(!host)return;
 if(!cart.length){host.innerHTML='<div class="cart-empty"><span>🛒</span><b>Your cart is empty</b><p>Add products to your cart and they will appear here.</p></div>';}
 else host.innerHTML=cart.map(item=>{const p=cartProduct(item);if(!p)return "";return `<div class="cart-line"><img class="cart-line-image" src="${safe(getImage(p))}" alt="${safe(p.name)}" loading="lazy" onerror="this.style.visibility='hidden'"><div class="cart-line-main"><b>${safe(p.name)}</b><small>SKU: ${safe(p.sku||p.id)} · ${item.ratti} Ratti</small><strong>${fmt(priceAtWeight(p,item.ratti)*item.qty)}</strong></div><div class="cart-line-controls"><button data-qty="-1" data-key="${safe(item.key)}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-qty="1" data-key="${safe(item.key)}" aria-label="Increase quantity">+</button><button class="cart-remove" data-remove="${safe(item.key)}">Remove</button></div></div>`;}).join("");
 const total=cart.reduce((sum,item)=>{const p=cartProduct(item);return sum+(p?priceAtWeight(p,item.ratti)*item.qty:0)},0);
 $("#cartSubtotal").textContent=fmt(total); $("#drawerCount").textContent="("+cart.reduce((n,x)=>n+x.qty,0)+")"; updateCounts();
}
function openCart(){renderCart();$("#cartBackdrop").classList.add("open");$("#cartDrawer").classList.add("open");$("#cartDrawer").setAttribute("aria-hidden","false");}
function closeCart(){$("#cartBackdrop").classList.remove("open");$("#cartDrawer").classList.remove("open");$("#cartDrawer").setAttribute("aria-hidden","true");}
function sendCartEnquiry(){
 if(!cart.length){toast("Your cart is empty");return;}
 const phone=String(cfg.whatsappNumber||"").replace(/\D/g,"");if(!phone){toast("WhatsApp contact is not configured");return;}
 const lines=cart.map(item=>{const p=cartProduct(item);if(!p)return "";return `${p.name} | SKU ${p.sku||p.id} | ${item.ratti} Ratti × ${item.qty} | ${fmt(priceAtWeight(p,item.ratti))} each\nProduct page: ${productPageUrl(p)}\nImage: ${productImageUrl(p)}`;}).filter(Boolean).join("\n\n");
 const total=$("#cartSubtotal").textContent;
 const msg=`Namaste BABA GEMS, please confirm this cart enquiry:\n\n${lines}\n\nIndicative subtotal: ${total}\nPlease confirm actual stock, certificate/treatment details, final price and delivery charges.`;
 window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank","noopener,noreferrer");
}

function findAnyProduct(id){return allProducts.find(p=>p.id===id)||allNavratna.find(p=>p.sku===id)||null;}
function enquireOnWhatsApp(id,ratti=4){
 const p=findAnyProduct(id); if(!p){toast("Product unavailable");return;}
 const phone=String(cfg.whatsappNumber||"").replace(/\D/g,"");
 if(!phone){toast("WhatsApp contact is not configured");return;}
 const body=`Namaste BABA GEMS, I want to enquire about this product.\nProduct: ${p.name}\nSKU: ${p.sku||p.id}\nSelected weight: ${ratti} Ratti\nIndicative sample price: ${fmt(priceAtWeight(p,ratti))}\nProduct page: ${productPageUrl(p)}\nProduct image: ${productImageUrl(p)}\nPlease confirm actual availability, product details, treatment, certificate, final price and delivery charges.`;
 window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`,"_blank","noopener,noreferrer");
}

function updateProductPrice(id,ratti){
 const p=allProducts.find(x=>x.id===id);
 if(p){const el=document.querySelector(`[data-card-price="${CSS.escape(id)}"]`);if(el)el.innerHTML=`${fmt(priceAtWeight(p,ratti))}<span class="range">${ratti} Ratti selected · ${fmt(priceAtWeight(p,ratti))}</span>`;return;}
 const n=allNavratna.find(x=>x.sku===id);if(n){const el=document.querySelector(`[data-price-for="${CSS.escape(n.sku)}"]`);if(el)el.innerHTML=`${fmt(priceAtWeight(n,ratti))} <small>/ ${ratti} Ratti · sample price</small>`;}
}
function openModal(html){$("#modalContent").innerHTML=html;$("#modalBackdrop").classList.add("open");}
function closeModal(){$("#modalBackdrop").classList.remove("open");}
function applyConfig(){
 document.querySelectorAll("[data-brand-logo]").forEach(img=>{if(cfg.logo)img.src=cfg.logo;});
 document.querySelectorAll("[data-brand-banner]").forEach(img=>{if(cfg.banner)img.src=cfg.banner;});
 const email=$("[data-contact-email]");if(email&&cfg.email){email.href="mailto:"+cfg.email;email.textContent="✉ "+cfg.email;}
 const wa=$("[data-contact-whatsapp]");if(wa&&cfg.whatsappNumber){wa.href="https://wa.me/"+cfg.whatsappNumber.replace(/\D/g,"");}
 $$("[data-whatsapp-display]").forEach(el=>el.textContent=cfg.whatsappDisplay||cfg.whatsappNumber||"WhatsApp");
 const ig=$("[data-contact-instagram]");if(ig&&cfg.instagram)ig.href=cfg.instagram;
 const fb=$("[data-contact-facebook]");if(fb&&cfg.facebook)fb.href=cfg.facebook;
 const yt=$("[data-contact-youtube]");if(yt&&cfg.youtube)yt.href=cfg.youtube;
}
document.addEventListener("click",e=>{
 const cat=e.target.closest("[data-category]");
 if(cat){e.preventDefault();activeCategory=cat.dataset.category||"All";query="";$("#searchInput").value="";visibleCount=18;$$("[data-category]").forEach(el=>el.classList.toggle("active",el.classList.contains("chip")&&el.dataset.category===activeCategory||el.classList.contains("category-side")&&el.dataset.category===activeCategory));renderProducts();$("#catalog").scrollIntoView({behavior:"smooth",block:"start"});$("#nav").classList.remove("open");return;}
 const search=e.target.closest("[data-search]");
 if(search){e.preventDefault();query=search.dataset.search||"";activeCategory="All";$("#searchInput").value=query;visibleCount=18;renderProducts();$("#catalog").scrollIntoView({behavior:"smooth",block:"start"});closeMegaMenus();return;}
 const navAdd=e.target.closest("[data-add-nav]");
 if(navAdd){const card=navAdd.closest(".navratna-card");const r=Number(card.querySelector(".weight-select").value||4);addToCart(navAdd.dataset.addNav,r);return;}
 const add=e.target.closest("[data-add]");
 if(add){const id=add.dataset.add;const sel=document.querySelector(`[data-product-weight="${CSS.escape(id)}"]`);addToCart(id,Number(sel?.value||4));return;}
 const qty=e.target.closest("[data-qty]");
 if(qty){const item=cart.find(x=>x.key===qty.dataset.key);if(item){item.qty+=Number(qty.dataset.qty);if(item.qty<=0)cart=cart.filter(x=>x.key!==item.key);renderCart();}return;}
 const remove=e.target.closest("[data-remove]");
 if(remove){cart=cart.filter(x=>x.key!==remove.dataset.remove);renderCart();toast("Item removed from cart");return;}
 if(e.target.closest("#cartBtn")){openCart();return;}
 if(e.target.closest("#closeCart")||e.target.id==="cartBackdrop"){closeCart();return;}
 if(e.target.closest("#checkoutBtn")){sendCartEnquiry();return;}
 if(e.target.closest("#continueShopping")){closeCart();return;}
 const wish=e.target.closest("[data-wish]");
 if(wish){const id=wish.dataset.wish;wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];wish.classList.toggle("active",wishlist.includes(id));wish.textContent=wishlist.includes(id)?"♥":"♡";wish.classList.remove("heart-pop");void wish.offsetWidth;wish.classList.add("heart-pop");updateCounts();toast(wishlist.includes(id)?"Saved to wishlist":"Removed from wishlist");return;}
 if(e.target.closest("#wishlistBtn")){const items=wishlist.map(id=>allProducts.find(p=>p.id===id)).filter(Boolean);openModal(`<h2>Your Wishlist (${items.length})</h2>${items.length?items.map(p=>`<div class="wishlist-line"><b>${safe(p.name)}</b><span>${fmt(priceAtWeight(p,4))}</span><button class="btn gold-btn" data-add="${safe(p.id)}">Add to Cart</button></div>`).join(""):"<p>Your wishlist is empty. Tap the heart on a product to save it.</p>"}`);return;}
 if(e.target.closest("#modalClose")||e.target.id==="modalBackdrop"){closeModal();return;}

});
document.addEventListener("change",e=>{
 const weight=e.target.closest("[data-product-weight]");
 if(weight)updateProductPrice(weight.dataset.productWeight,Number(weight.value));
 const navWeight=e.target.closest("[data-weight]");
 if(navWeight)updateProductPrice(navWeight.dataset.weight,Number(navWeight.value));
});
$("#searchForm").addEventListener("submit",e=>{e.preventDefault();query=$("#searchInput").value.trim();activeCategory="All";visibleCount=18;renderProducts();$("#catalog").scrollIntoView({behavior:"smooth",block:"start"});});
["minPrice","maxPrice","sort"].forEach(id=>$("#"+id).addEventListener("input",()=>{visibleCount=18;renderProducts();}));
$("#loadMore").addEventListener("click",()=>{visibleCount+=18;renderProducts();});
$("#mobileMenu").addEventListener("click",()=>$("#nav").classList.toggle("open"));
$$(".nav-item>.nav-link").forEach(link=>link.addEventListener("click",e=>{if(innerWidth<=600){e.preventDefault();link.parentElement.classList.toggle("expanded");}}));
$("#year").textContent=new Date().getFullYear();
applyConfig();renderNavratna();renderProducts();updateCounts();renderCart();
function closeMegaMenus(){ $$(".nav-item").forEach(el=>el.classList.remove("expanded")); }

const rattiCalculator=$("#rattiCalculator");
if(rattiCalculator)rattiCalculator.addEventListener("submit",e=>{e.preventDefault();const kg=Number($("#guideWeight").value);const age=Number($("#guideAge").value);const out=$("#rattiResult");if(!kg||kg<=0){out.textContent="Please enter a valid body weight.";return;}const low=kg/12,high=kg/10;const fmtR=n=>Number(n).toLocaleString("en-IN",{maximumFractionDigits:1});out.textContent=`Traditional estimate${age?` for age ${age}`:""}: about ${fmtR(low)}–${fmtR(high)} Ratti based on body weight. Age itself does not set the Ratti amount.`;});
