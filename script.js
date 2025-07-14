/**
 * @file script.js
 * @description The definitive, complete, and refactored script for all dynamic UI components.
 * @version 6.0.0
 * @date 2025-07-14
 */

(function () {
  'use strict';

  /**
   * --------------------------------------------------------------------------
   * UTILITY FUNCTIONS
   * --------------------------------------------------------------------------
   */
  const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => callback.apply(null, args), wait);
    };
  };

  const isPrintableChar = (str) => str?.length === 1 && str.match(/^\S$/);

  /**
   * --------------------------------------------------------------------------
   * REUSABLE UI COMPONENT CLASSES
   * --------------------------------------------------------------------------
   */

  class Tabs {
    constructor(container) {
      this.container = container;
      this.tabList = container.querySelector('[role="tablist"]');
      this.tabs = Array.from(container.querySelectorAll('[role="tab"]'));
      this.panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));
      if (!this.tabList || this.tabs.length === 0) return;
      this.init();
    }
    init() {
      const activeTab = this.tabs.find(t => t.getAttribute('aria-selected') === 'true') || this.tabs[0];
      this.activateTab(activeTab, false);
      this.tabList.addEventListener('click', e => this.handleTabClick(e));
      this.tabList.addEventListener('keydown', e => this.handleTabKeyDown(e));
    }
    handleTabClick(e) {
      const clickedTab = e.target.closest('[role="tab"]');
      if (clickedTab) this.activateTab(clickedTab);
    }
    activateTab(tab, setFocus = true) {
      this.tabs.forEach(t => {
        const panel = this.panels.find(p => p.id === t.getAttribute('aria-controls'));
        const isSelected = t === tab;
        t.setAttribute('aria-selected', String(isSelected));
        t.setAttribute('tabindex', isSelected ? '0' : '-1');
        t.classList.toggle('active', isSelected);
        t.classList.toggle('current', isSelected);
        panel?.toggleAttribute('hidden', !isSelected);
      });
      if (setFocus) tab.focus();
    }
    handleTabKeyDown(e) {
      const currentIndex = this.tabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;
      let newIndex;
      if (e.key === 'ArrowRight') newIndex = (currentIndex + 1) % this.tabs.length;
      else if (e.key === 'ArrowLeft') newIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
      if (newIndex !== undefined) {
        e.preventDefault();
        this.activateTab(this.tabs[newIndex]);
      }
    }
  }

  class AnimatedAccordion {
    constructor(element) {
      this.details = element;
      this.summary = element.querySelector('summary');
      if (!this.summary) return;
      this.content = this.summary.nextElementSibling;
      this.animation = null;
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }
    onClick(e) {
      e.preventDefault();
      if (this.details.open) this.close();
      else this.open();
    }
    close() {
      const startHeight = `${this.details.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight}px`;
      if (this.animation) this.animation.cancel();
      this.animation = this.details.animate({ height: [startHeight, endHeight] }, { duration: 200, easing: 'ease-out' });
      this.animation.onfinish = () => this.details.removeAttribute('open');
    }
    open() {
      this.details.style.height = `${this.summary.offsetHeight}px`;
      this.details.setAttribute('open', '');
      const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;
      if (this.animation) this.animation.cancel();
      this.animation = this.details.animate({ height: [this.details.style.height, endHeight] }, { duration: 200, easing: 'ease-out' });
      this.animation.onfinish = () => this.details.style.height = '';
    }
  }
  
  class SimpleAccordion {
    constructor(element) {
        this.toggle = element;
        this.content = element.nextElementSibling;
        if (!this.content) return;
        this.toggle.addEventListener('click', () => this.onClick());
    }
    onClick() {
        const isActive = this.toggle.classList.contains('active');
        if (isActive) {
            this.content.style.display = 'none';
            this.toggle.classList.remove('active');
        } else {
            // Close siblings
            const parent = this.toggle.parentNode;
            parent.querySelectorAll('.accordion.active').forEach(activeToggle => {
                activeToggle.classList.remove('active');
                activeToggle.nextElementSibling.style.display = 'none';
            });
            // Open current
            this.content.style.display = 'block';
            this.toggle.classList.add('active');
        }
    }
  }

  class Dropdown {
    constructor(toggle) {
      this.toggle = toggle;
      this.menu = toggle.nextElementSibling;
      if (!this.menu) return;
      this.menuItems = Array.from(this.menu.querySelectorAll("[role^='menuitem']"));
      this.focusedIndex = -1;
      this.init();
    }
    get isExpanded() { return this.toggle.getAttribute('aria-expanded') === 'true'; }
    init() {
      const toggleId = this.toggle.id || `dropdown-toggle-${crypto.randomUUID()}`;
      const menuId = this.menu.id || `dropdown-menu-${crypto.randomUUID()}`;
      this.toggle.id = toggleId;
      this.menu.id = menuId;
      this.toggle.setAttribute('aria-controls', menuId);
      this.menu.setAttribute('aria-labelledby', toggleId);
      this.menu.tabIndex = -1;
      this.menuItems.forEach(item => item.tabIndex = -1);
      this.toggle.addEventListener('click', e => this.clickHandler(e));
      this.toggle.addEventListener('keydown', e => this.toggleKeyHandler(e));
      this.menu.addEventListener('keydown', e => this.menuKeyHandler(e));
      document.body.addEventListener('click', e => this.outsideClickHandler(e));
    }
    clickHandler(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.isExpanded) this.dismiss();
      else {
        this.open();
        this.focusByIndex(0);
      }
    }
    outsideClickHandler(e) {
      if (this.isExpanded && !this.toggle.contains(e.target) && !this.menu.contains(e.target)) {
        this.dismiss();
      }
    }
    dismiss(refocus = true) {
      if (!this.isExpanded) return;
      this.toggle.setAttribute('aria-expanded', 'false');
      if (refocus) this.toggle.focus();
    }
    open() {
      if (this.isExpanded) return;
      this.toggle.setAttribute('aria-expanded', 'true');
    }
    focusByIndex(index) {
      if (!this.menuItems.length) return;
      this.focusedIndex = (index + this.menuItems.length) % this.menuItems.length;
      this.menuItems.forEach((item, i) => item.tabIndex = i === this.focusedIndex ? 0 : -1);
      this.menuItems[this.focusedIndex].focus();
    }
    toggleKeyHandler(e) {
      switch (e.key) {
        case 'ArrowDown': case 'Enter': case ' ': e.preventDefault(); this.open(); this.focusByIndex(0); break;
        case 'ArrowUp': e.preventDefault(); this.open(); this.focusByIndex(this.menuItems.length - 1); break;
        case 'Escape': this.dismiss(); break;
      }
    }
    menuKeyHandler(e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      switch (e.key) {
        case 'Escape': e.preventDefault(); this.dismiss(); break;
        case 'ArrowDown': e.preventDefault(); this.focusByIndex(this.focusedIndex + 1); break;
        case 'ArrowUp': e.preventDefault(); this.focusByIndex(this.focusedIndex - 1); break;
        case 'Home': case 'PageUp': e.preventDefault(); this.focusByIndex(0); break;
        case 'End': case 'PageDown': e.preventDefault(); this.focusByIndex(this.menuItems.length - 1); break;
        case 'Tab': this.dismiss(!e.shiftKey); break;
        default: if (isPrintableChar(e.key)) { e.preventDefault(); this.focusByChar(e.key); }
      }
    }
    focusByChar(char) {
      char = char.toLowerCase();
      const itemChars = this.menuItems.map(item => item.textContent.trim()[0].toLowerCase());
      let index = itemChars.indexOf(char, this.focusedIndex + 1);
      if (index === -1) index = itemChars.indexOf(char, 0);
      if (index > -1) this.focusByIndex(index);
    }
  }

  /**
   * --------------------------------------------------------------------------
   * FEATURE MODULES
   * --------------------------------------------------------------------------
   */

  const Navigation = {
    init() {
      document.querySelectorAll('.menu-button-mobile, .collapsible-nav-toggle, .collapsible-sidebar-toggle').forEach(toggle => {
        const target = document.getElementById(toggle.getAttribute('aria-controls'));
        if (target) {
          const closeNav = () => {
            toggle.setAttribute('aria-expanded', 'false');
            target.setAttribute('aria-expanded', 'false');
            toggle.focus();
          };
          toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
            target.setAttribute('aria-expanded', !isExpanded);
          });
          target.addEventListener('keyup', e => { if (e.key === 'Escape') closeNav(); });
        }
      });
    }
  };

  const Search = {
    init() {
      document.querySelectorAll("form[role='search']").forEach(form => {
        const input = form.querySelector("input[type='search']");
        if (!input) return;

        const clearButton = this.buildClearButton(input);
        form.appendChild(clearButton);
        form.classList.toggle('search-has-value', !!input.value);

        const toggleClearButton = debounce(() => form.classList.toggle('search-has-value', !!input.value), 200);
        const clearInput = () => {
          input.value = '';
          form.classList.remove('search-has-value');
          input.focus();
        };

        input.addEventListener('keyup', e => {
          if (e.key === 'Escape') clearInput();
          toggleClearButton();
        });
        clearButton.addEventListener('click', clearInput);
      });
    },
    buildClearButton(input) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'clear-button';
      button.setAttribute('aria-controls', input.id);
      const label = window.searchClearButtonLabelLocalized || 'Clear search';
      button.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${label}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
      return button;
    }
  };

  const Forms = {
    init() {
      this.setupFocusManagement();
      this.setupCommentForms();
      this.setupMarkAsSolved();
      this.setupErrorFocus();
    },
    setupFocusManagement() {
      const FOCUS_KEY = 'returnFocusTo';
      const saveFocus = () => { if (document.activeElement?.id) sessionStorage.setItem(FOCUS_KEY, `#${document.activeElement.id}`); };
      const returnFocus = () => {
        const selector = sessionStorage.getItem(FOCUS_KEY);
        if (selector) {
          sessionStorage.removeItem(FOCUS_KEY);
          document.querySelector(selector)?.focus();
        }
      };
      returnFocus();
      document.querySelectorAll('#request-status-select, #request-organization-select, #request-organization select').forEach(el => {
        el.addEventListener('change', () => { saveFocus(); el.form.submit(); });
      });
      document.querySelector('#quick-search')?.addEventListener('keyup', e => {
        if (e.key === 'Enter') { saveFocus(); e.target.form.submit(); }
      });
    },
    setupCommentForms() {
      const textarea = document.querySelector(".comment-container textarea");
      const controls = document.querySelector(".comment-form-controls, .comment-ccs");
      if (textarea && controls) {
        const show = () => controls.style.display = 'block';
        if (textarea.value) show();
        textarea.addEventListener('focus', show, { once: true });
      }
    },
    setupMarkAsSolved() {
      const button = document.querySelector(".request-container .mark-as-solved:not([data-disabled])");
      const textarea = document.querySelector(".request-container .comment-container textarea");
      if (!button || !textarea) return;
      button.addEventListener('click', () => {
        const checkbox = document.querySelector(".request-container .comment-container input[type=checkbox]");
        if (checkbox) checkbox.checked = true;
        button.form.submit();
      });
      const isEmpty = textarea.dataset.helper === "wysiwyg"
        ? (xml) => !xml || new DOMParser().parseFromString(`<r>${xml}</r>`, "text/xml").documentElement.textContent.trim() === ''
        : (s) => !s || s.trim() === '';
      textarea.addEventListener("input", () => {
        const solveText = button.getAttribute("data-solve-translation");
        const solveSubmitText = button.getAttribute("data-solve-and-submit-translation");
        button.innerText = isEmpty(textarea.value) ? solveText : solveSubmitText;
      });
    },
    setupErrorFocus() {
      document.querySelector('.notification-error')?.previousElementSibling?.focus();
    }
  };
  
  const VideoPlayer = {
      init() {
          const video = document.getElementById("myVideo");
          const btnV = document.getElementById("myBtn");
          if (video && btnV) {
              btnV.addEventListener('click', () => {
                  if (video.paused) {
                      video.play();
                      btnV.innerHTML = "Pause";
                  } else {
                      video.pause();
                      btnV.innerHTML = "Play";
                  }
              });
          }
          
          // This assumes `fetchVideo` is called from an element with data-video attribute
          // and an adjacent player element. This part is less robust without seeing the HTML.
          // A more robust implementation would use event delegation.
      }
  };

  const KBEnhancements = {
    init() {
      const kbWrapper = document.querySelector('#kb-article-wrapper, #nfcc-kb-article-wrapper');
      if (!kbWrapper) return;
      document.body.classList.add('kb-article-view');

      this.initStickyNav();
      this.initTOC(kbWrapper);
      this.initClipboard();
      this.initImageZoom(kbWrapper);
      this.initReadingProgress();
      this.initExpandCollapseAll();
      this.initChecklists();
      this.initSteppers();
      this.initCommandPalette();
      this.initImageComparison();
      this.initHotspots();
      this.initContentDrawer();
      this.initComparisonGrid();
      this.initScenarioToggles();
      this.initFavorites();
      this.initChart();
    },
    initStickyNav() {
      const stickyEl = document.querySelector('.kb-sticky-nav');
      if (!stickyEl) return;
      const offsetTop = stickyEl.offsetTop;
      window.addEventListener('scroll', () => stickyEl.classList.toggle('stuck', window.scrollY >= offsetTop));
      stickyEl.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) window.scrollTo({ top: target.offsetTop - (stickyEl.offsetHeight + 20), behavior: 'smooth' });
        });
      });
    },
    initTOC(kbWrapper) {
      const tocContainer = document.getElementById('toc-container');
      const headings = Array.from(kbWrapper.querySelectorAll('h2, h3'));
      if (!tocContainer || headings.length < 2) return;
      tocContainer.innerHTML = '<h3>On this page</h3>';
      const tocList = document.createElement('ul');
      headings.forEach((h, i) => {
        h.id = h.id || `toc-heading-${i}`;
        tocList.innerHTML += `<li class="toc-level-${h.tagName.toLowerCase()}"><a href="#${h.id}">${h.textContent}</a></li>`;
      });
      tocContainer.appendChild(tocList);
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const link = tocContainer.querySelector(`a[href="#${entry.target.id}"]`);
          if (entry.isIntersecting) {
            tocContainer.querySelectorAll('a').forEach(a => a.classList.remove('is-active'));
            link?.classList.add('is-active');
          }
        });
      }, { rootMargin: "0px 0px -80% 0px" });
      headings.forEach(h => observer.observe(h));
    },
    initClipboard() {
      document.querySelectorAll('.kb-copy-snippet').forEach(snippet => {
        const button = snippet.querySelector('button');
        const textToCopy = snippet.querySelector('code')?.innerText;
        if (button && textToCopy) {
          button.addEventListener('click', () => {
            navigator.clipboard.writeText(textToCopy).then(() => {
              const originalText = button.innerHTML;
              button.innerHTML = 'Copied!';
              button.classList.add('copied');
              setTimeout(() => { button.innerHTML = originalText; button.classList.remove('copied'); }, 2000);
            });
          });
        }
      });
    },
    initImageZoom(kbWrapper) {
      kbWrapper.querySelectorAll('img:not(a > img)').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
          const overlay = document.createElement('div');
          overlay.className = 'image-zoom-overlay';
          overlay.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
          overlay.addEventListener('click', () => overlay.classList.remove('visible'));
          overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
          document.body.appendChild(overlay);
          setTimeout(() => overlay.classList.add('visible'), 10);
        });
      });
    },
    initReadingProgress() {
      const bar = document.createElement('div');
      bar.id = 'reading-progress-bar';
      document.body.appendChild(bar);
      window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = scrollHeight > 0 ? `${(window.scrollY / scrollHeight) * 100}%` : '0%';
      });
    },
    initExpandCollapseAll() {
      const allDetails = document.querySelectorAll('.kb-details');
      const expandBtn = document.getElementById('expandAllDetails');
      const collapseBtn = document.getElementById('collapseAllDetails');
      if (allDetails.length > 0 && expandBtn && collapseBtn) {
        const clickAll = (openState) => allDetails.forEach(d => {
          if (d.open !== openState) d.querySelector('summary')?.click();
        });
        expandBtn.addEventListener('click', () => clickAll(true));
        collapseBtn.addEventListener('click', () => clickAll(false));
      }
    },
    initChecklists() {
      document.querySelectorAll('.interactive-checklist li').forEach(item => {
        item.addEventListener('click', () => item.classList.toggle('checked'));
      });
    },
    initSteppers() {
      document.querySelectorAll('.stepper').forEach(stepper => {
        const steps = stepper.querySelectorAll('.stepper-item');
        steps.forEach((step, index) => {
          step.addEventListener('click', () => {
            steps.forEach((s, i) => {
              s.classList.remove('is-active', 'is-completed');
              if (i < index) s.classList.add('is-completed');
              else if (i === index) s.classList.add('is-active');
            });
          });
        });
      });
    },
    initCommandPalette() {
      const overlay = document.getElementById('commandPaletteOverlay');
      const input = document.getElementById('commandPaletteInput');
      const results = document.getElementById('commandPaletteResults');
      if (!overlay || !input || !results) return;

      const openPalette = () => {
        overlay.style.display = 'flex';
        buildResults('');
        input.focus();
      };
      const closePalette = () => {
        overlay.style.display = 'none';
        input.value = '';
      };
      const buildResults = (query) => {
        const links = [...new Set(Array.from(document.querySelectorAll('a[href]'))
          .map(a => ({ href: a.href, text: a.innerText.trim() }))
          .filter(l => l.text && !l.href.includes('javascript:void(0)'))
        )];
        const filtered = links.filter(l => l.text.toLowerCase().includes(query.toLowerCase()));
        results.innerHTML = filtered.slice(0, 10).map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('');
      };

      document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openPalette(); }
        if (e.key === 'Escape' && overlay.style.display === 'flex') closePalette();
      });
      input.addEventListener('input', () => buildResults(input.value));
      overlay.addEventListener('click', e => { if (e.target === overlay) closePalette(); });
      results.addEventListener('click', closePalette);
    },
    initImageComparison() {
      document.querySelectorAll('.comparison-slider').forEach(slider => {
        let isDragging = false;
        const handle = slider.querySelector('.slider-handle');
        const topImg = slider.querySelector('.img-top');
        if (!handle || !topImg) return;

        const moveSlider = (e) => {
          if (!isDragging) return;
          const rect = slider.getBoundingClientRect();
          let x = (e.clientX || e.touches[0].clientX) - rect.left;
          x = Math.max(0, Math.min(x, rect.width));
          const percentage = (x / rect.width) * 100;
          topImg.style.width = `${percentage}%`;
          handle.style.left = `${percentage}%`;
        };

        const startDrag = (e) => { e.preventDefault(); isDragging = true; };
        const stopDrag = () => { isDragging = false; };

        handle.addEventListener('mousedown', startDrag);
        document.addEventListener('mouseup', stopDrag);
        handle.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('mousemove', moveSlider);
        document.addEventListener('touchmove', moveSlider, { passive: false });
      });
    },
    initHotspots() {
      const allHotspots = document.querySelectorAll('.hotspot');
      if (allHotspots.length === 0) return;
      allHotspots.forEach(hotspot => {
        hotspot.addEventListener('click', e => {
          e.stopPropagation();
          const isActive = hotspot.classList.contains('active');
          allHotspots.forEach(h => h.classList.remove('active'));
          if (!isActive) hotspot.classList.add('active');
        });
      });
      document.addEventListener('click', e => {
        if (!e.target.closest('.hotspot')) {
          allHotspots.forEach(h => h.classList.remove('active'));
        }
      });
    },
    initContentDrawer() {
      const overlay = document.getElementById('contentDrawerOverlay');
      const closeBtn = document.getElementById('contentDrawerClose');
      const titleEl = document.getElementById('contentDrawerTitle');
      const contentEl = document.getElementById('contentDrawerContent');
      if (!overlay || !closeBtn || !titleEl || !contentEl) return;

      const closeDrawer = () => overlay.classList.remove('is-open');
      const loadContent = async (url, selector) => {
        overlay.classList.add('is-open');
        contentEl.classList.add('is-loading');
        titleEl.textContent = 'Loading...';
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Network response failed');
          const htmlText = await response.text();
          const doc = new DOMParser().parseFromString(htmlText, 'text/html');
          const targetElement = doc.querySelector(selector);
          titleEl.textContent = doc.querySelector('h1.article-title')?.innerText.trim() || 'Content';
          contentEl.innerHTML = targetElement?.innerHTML || `<p>Content not found.</p>`;
        } catch (error) {
          titleEl.textContent = 'Error';
          contentEl.innerHTML = '<p>Sorry, there was an error loading content.</p>';
        } finally {
          contentEl.classList.remove('is-loading');
        }
      };

      document.body.addEventListener('click', e => {
        const link = e.target.closest('a[data-drawer-content]');
        if (link) {
          e.preventDefault();
          loadContent(link.href, link.dataset.drawerContent);
        }
      });
      closeBtn.addEventListener('click', closeDrawer);
      overlay.addEventListener('click', e => { if (e.target === overlay) closeDrawer(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeDrawer(); });
    },
    initComparisonGrid() {
      document.querySelectorAll('.comparison-grid-container').forEach(container => {
        const buttons = container.querySelectorAll('.grid-filter-btn');
        const grid = container.querySelector('.comparison-grid');
        if (!grid || buttons.length === 0) return;
        buttons.forEach(button => {
          button.addEventListener('click', () => {
            const col = button.dataset.highlightCol;
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            grid.dataset.highlighting = col;
          });
        });
      });
    },
    initScenarioToggles() {
      document.querySelectorAll('.scenario-toggles').forEach(container => {
        const buttons = container.querySelectorAll('.scenario-btn');
        const contentWrapper = container.nextElementSibling;
        if (!contentWrapper?.classList.contains('scenario-content-wrapper')) return;
        buttons.forEach(button => {
          button.addEventListener('click', () => {
            const targetId = button.dataset.scenarioTarget;
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            contentWrapper.querySelectorAll('.scenario-content').forEach(content => {
              content.classList.toggle('is-active', content.dataset.scenario === targetId);
            });
          });
        });
      });
    },
    initFavorites() {
      const KEY = 'percapitaKbFavorites';
      const listContainer = document.getElementById('favorites-list');
      const favBtn = document.querySelector('.favorite-btn');
      
      const getFavorites = () => JSON.parse(localStorage.getItem(KEY)) || [];
      const saveFavorites = (favs) => localStorage.setItem(KEY, JSON.stringify(favs));

      const renderList = () => {
        if (!listContainer) return;
        const favorites = getFavorites();
        if (favorites.length === 0) {
          listContainer.innerHTML = '<li class="no-favorites">You haven\'t favorited any articles yet.</li>';
        } else {
          listContainer.innerHTML = favorites.map(f => `<li><a href="${f.url}" role="menuitem">${f.title}</a></li>`).join('');
        }
      };

      if (favBtn) {
        const url = window.location.href;
        const updateBtnState = () => {
          const isFavorited = getFavorites().some(f => f.url === url);
          favBtn.classList.toggle('is-favorite', isFavorited);
          favBtn.querySelector('span').textContent = isFavorited ? 'Favorited' : 'Favorite';
        };
        favBtn.addEventListener('click', () => {
          const favorites = getFavorites();
          const title = document.querySelector('h1.article-title')?.innerText.trim();
          const index = favorites.findIndex(f => f.url === url);
          if (index > -1) favorites.splice(index, 1);
          else if (title) favorites.push({ title, url });
          saveFavorites(favorites);
          updateBtnState();
          renderList();
        });
        updateBtnState();
      }
      renderList();
    },
    initChart() {
      const ctx = document.getElementById('savingsGrowthChart');
      if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
            datasets: [{
              label: 'Total Savings',
              backgroundColor: 'rgba(62, 79, 229, 0.8)',
              borderColor: 'rgb(62, 79, 229)',
              borderWidth: 1,
              borderRadius: 4,
              data: [2255, 3568, 4941, 6380, 7888],
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false }, title: { display: true, text: 'Savings Balance ($)' } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }
  };
  
  
  /** tabs */
   // --- Reusable Tab Component Logic ---
    const allTabContainers = document.querySelectorAll('.kb-tabs');
    allTabContainers.forEach(tabContainer => {
        const tabs = tabContainer.querySelectorAll('.kb-tab');
        const panels = tabContainer.querySelectorAll('.kb-tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab;
                const targetPanel = document.getElementById(targetId);

                // Deactivate all tabs and panels in this container
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));

                // Activate the clicked tab and corresponding panel
                tab.classList.add('active');
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }); // The loop for tabs correctly ends here.

  

  /**
   * --------------------------------------------------------------------------
   * MAIN INITIALIZATION
   * --------------------------------------------------------------------------
   */
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize all component classes
    document.querySelectorAll('.tab-container').forEach(c => new Tabs(c));
    document.querySelectorAll('details.kb-details').forEach(el => new AnimatedAccordion(el));
    document.querySelectorAll('.accordion').forEach(el => new SimpleAccordion(el));
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => new Dropdown(toggle));

    // Initialize all feature modules
    Navigation.init();
    Search.init();
    Forms.init();
    VideoPlayer.init();
    KBEnhancements.init();

    // One-off initializers
    document.querySelectorAll('.share a').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(anchor.href, 'share-window', 'height=500,width=500,popup');
      });
    });

    document.querySelectorAll(".multibrand-filter-list").forEach(filter => {
      if (filter.children.length > 6) {
        const trigger = filter.querySelector(".see-all-filters");
        if (trigger) {
          trigger.hidden = false;
          trigger.addEventListener("click", () => {
            trigger.remove();
            filter.classList.remove("multibrand-filter-list--collapsed");
          }, { once: true });
        }
      }
    });
  });

})();