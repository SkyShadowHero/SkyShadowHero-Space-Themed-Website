// 脚印加载动画
window.addEventListener('DOMContentLoaded', function() {
  const fps = document.querySelectorAll('#footprints .footprint');
  let step = 0;
  function animateFootprints() {
    fps.forEach((fp, i) => {
      fp.style.opacity = (i === step) ? '1' : '0.2';
    });
    step = (step + 1) % 3;
  }
  let timer = setInterval(animateFootprints, 350);
  animateFootprints();

  // 最短显示5秒
  let minShow = false, loaded = false;
  function hideLoadingMask() {
    const mask = document.getElementById('loading-mask');
    if (mask) {
      mask.style.opacity = '0';
      setTimeout(() => {
        mask.style.display = 'none';
      }, 500); // 与transition一致
    }
  }
  setTimeout(() => {
    minShow = true;
    if (loaded) {
      clearInterval(timer);
      hideLoadingMask();
    }
  }, 1000);

  window.addEventListener('load', function() {
    loaded = true;
    if (minShow) {
      clearInterval(timer);
      hideLoadingMask();
    }
  });
});