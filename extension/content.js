console.log("🛡️ TrustMesh Sentinel: ACTIVE");

async function verifyImage(img) {
  if (img.dataset.trustmeshStatus || img.width < 100 || img.height < 100) return;
  if (img.src.startsWith('blob:') || img.src.startsWith('data:')) return;
  img.dataset.trustmeshStatus = "pending";
  console.log("📸 Scanning image:", img.src);

  try {
    const imgRes = await fetch(img.src);
    const blob = await imgRes.blob();
    const formData = new FormData();
    formData.append('file', blob, 'scanned_image.png');
    formData.append('webContext', img.src + " " + (img.alt || ""));

    const response = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    let bgColor, text, outlineColor;
    if (data.isAI) {
      bgColor = 'rgba(139,58,220,0.93)';
      text = '🤖 AI Generated';
      outlineColor = '#a855f7';
      img.dataset.trustmeshStatus = "ai";
    } else if (data.verified) {
      bgColor = 'rgba(21,163,74,0.93)';
      text = '✅ Verified';
      outlineColor = '#22c55e';
      img.dataset.trustmeshStatus = "verified";
    } else {
      bgColor = 'rgba(200,40,40,0.93)';
      text = '⚠️ Unverified';
      outlineColor = '#ef4444';
      img.dataset.trustmeshStatus = "unverified";
    }

    // Apply outline to image — zero layout impact
    img.style.outline = `3px solid ${outlineColor}`;
    img.style.borderRadius = '3px';

    // Find closest positioned ancestor to attach badge correctly
    function getPositionedParent(el) {
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const pos = window.getComputedStyle(parent).position;
        if (pos === 'relative' || pos === 'absolute' || pos === 'fixed' || pos === 'sticky') {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    }

    const posParent = getPositionedParent(img);

    // Create badge
    const badge = document.createElement('div');
    badge.setAttribute('data-trustmesh-badge', 'true');
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 4px 9px;
      border-radius: 5px;
      font-family: system-ui, sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: white;
      z-index: 2147483647;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      pointer-events: none;
      white-space: nowrap;
      line-height: 1.4;
      background: ${bgColor};
    `;
    badge.textContent = text;

    if (posParent) {
      // Attach to the positioned parent and calculate offset relative to it
      posParent.appendChild(badge);
      const parentRect = posParent.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      badge.style.top = (imgRect.top - parentRect.top + 8) + 'px';
      badge.style.left = (imgRect.left - parentRect.left + 8) + 'px';
    } else {
      // Fallback: make image wrapper relative and attach badge
      const wrapper = img.parentElement;
      const originalPosition = window.getComputedStyle(wrapper).position;
      if (originalPosition === 'static') {
        wrapper.style.position = 'relative';
      }
      wrapper.appendChild(badge);
      badge.style.top = '8px';
      badge.style.left = '8px';
    }

  } catch (err) {
    console.error("❌ TrustMesh Scan Failed:", err.message);
    img.dataset.trustmeshStatus = "offline";
  }
}

setInterval(() => {
  document.querySelectorAll('img').forEach(verifyImage);
}, 2500);