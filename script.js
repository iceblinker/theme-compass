(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Navigation
  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    if (menuButton && menuList) {
      menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleNavigation(menuButton, menuList);
      });

      menuList.addEventListener("keyup", (event) => {
        if (event.keyCode === ESCAPE) {
          event.stopPropagation();
          closeNavigation(menuButton, menuList);
        }
      });
    }

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      if (toggle) {
        element.addEventListener("click", () => {
          toggleNavigation(toggle, element);
        });

        element.addEventListener("keyup", (event) => {
          if (event.keyCode === ESCAPE) {
            closeNavigation(toggle, element);
          }
        });
      }
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        if (trigger) {
          trigger.setAttribute("aria-hidden", false);

          // Add event handler for click
          trigger.addEventListener("click", (event) => {
            event.stopPropagation();
            trigger.parentNode.removeChild(trigger);
            filter.classList.remove("multibrand-filter-list--collapsed");
          });
        }
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));
    
    // Use crypto.randomUUID if available, otherwise a simple fallback
    const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : () => Math.random().toString(36).substring(2, 15);
    
    const toggleId = this.toggle.getAttribute("id") || randomUUID();
    const menuId = this.menu.getAttribute("id") || randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;

      this.toggle.removeAttribute("aria-expanded");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", true);
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;

      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();

      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      // look up starting from current index
      let index = itemChars.indexOf(char, startIndex);

      // if not found, start from start
      if (index === -1) {
        index = itemChars.indexOf(char, 0);
      }

      if (index > -1) {
        this.focusByIndex(index);
      }
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;

      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusLastMenuItem();
          break;
        }
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (key) {
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home":
        case "PageUp": {
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End":
        case "PageDown": {
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Dropdowns
  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share
  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Vanilla JS debounce function, by Josh W. Comeau:
  // https://www.joshwcomeau.com/snippets/javascript/debounce/
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Define variables for search field
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  // Clear the search input, and then return focus to it
  function clearSearchInput(event) {
    event.target
      .closest(searchFormSelector)
      .classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    input.value = "";
    input.focus();
  }

  // Have the search input and clear button respond
  // when someone presses the escape key, per:
  // https://twitter.com/adambsilver/status/1152452833234554880
  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  // Create an HTML button that all users -- especially keyboard users --
  // can interact with, to clear the search input.
  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized || 'Clear search'; // Fallback text
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  // Append the clear button to the search form
  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    if(form) {
        form.classList.toggle(
          searchFormFilledClassName,
          event.target.value.length > 0
        );
    }
  }, 200);

  // Search
  window.addEventListener("DOMContentLoaded", () => {
    // Set up clear functionality for the search field
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
        if (input) {
          appendClearSearchButton(input, input.closest(searchFormSelector));
          input.addEventListener("keyup", clearSearchInputOnKeypress);
          input.addEventListener("keyup", toggleClearSearchButtonAvailability);
        }
    });
  });

  const focusKey = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    if (activeElementId) {
      sessionStorage.setItem(focusKey, "#" + activeElementId);
    }
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(focusKey);
    if (returnFocusTo) {
      sessionStorage.removeItem(focusKey);
      const returnFocusToEl = document.querySelector(returnFocusTo);
      if(returnFocusToEl && typeof returnFocusToEl.focus === 'function') {
        returnFocusToEl.focus();
      }
    }
  }

  // Forms
  window.addEventListener("DOMContentLoaded", () => {
    // In some cases we should preserve focus after page reload
    returnFocus();

    // show form controls when the textarea receives focus or back button is used and value exists
    const commentContainerTextarea = document.querySelector(
      ".comment-container textarea"
    );
    const commentContainerFormControls = document.querySelector(
      ".comment-form-controls, .comment-ccs"
    );

    if (commentContainerTextarea && commentContainerFormControls) {
      commentContainerTextarea.addEventListener(
        "focus",
        function focusCommentContainerTextarea() {
          commentContainerFormControls.style.display = "block";
          commentContainerTextarea.removeEventListener(
            "focus",
            focusCommentContainerTextarea
          );
        }
      );

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    // Expand Request comment form when Add to conversation is clicked
    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        if(requestCommentSubmit) {
            requestCommentSubmit.style.display = "inline-block";
        }

        if (commentContainerTextarea) {
          commentContainerTextarea.focus();
        }
      });
    }

    // Mark as solved button
    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", "true");
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", "true");
        requestMarkAsSolvedButton.form.submit();
      });
    }

    // Change Mark as solved text according to whether comment is filled
    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    if (requestCommentTextarea) {
        const usesWysiwyg = requestCommentTextarea.dataset.helper === "wysiwyg";

        function isEmptyPlaintext(s) {
          return s.trim() === "";
        }

        function isEmptyHtml(xml) {
          const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
          const img = doc.querySelector("img");
          return img === null && isEmptyPlaintext(doc.children[0].textContent);
        }

        const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;
      
        requestCommentTextarea.addEventListener("input", () => {
            if (requestMarkAsSolvedButton) {
              if (isEmpty(requestCommentTextarea.value)) {
                requestMarkAsSolvedButton.innerText =
                  requestMarkAsSolvedButton.getAttribute("data-solve-translation");
              } else {
                requestMarkAsSolvedButton.innerText =
                  requestMarkAsSolvedButton.getAttribute(
                    "data-solve-and-submit-translation"
                  );
              }
            }
        });
    }

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );

    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    // Submit requests filter form on search in the request list page
    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    // Submit organization form in the request page
    const requestOrganisationSelect = document.querySelector(
      "#request-organization select"
    );

    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });

      requestOrganisationSelect.addEventListener("click", (e) => {
        // Prevents Ticket details collapsible-sidebar to close on mobile
        e.stopPropagation();
      });
    }

    // If there are any error notifications below an input field, focus that field
    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

})();


/*****************************************************************/
/* --- MERGED SCRIPTS FROM NEWER FUNCTIONALITY --- */
/*****************************************************************/
document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     FEATURE-RICH KB SCRIPTS
     ========================================================================== */

  // --- Command Palette (Cmd/Ctrl + K) ---
  const commandPaletteOverlay = document.getElementById('commandPaletteOverlay');
  const commandPaletteInput = document.getElementById('commandPaletteInput');
  const commandPaletteResults = document.getElementById('commandPaletteResults');

  if (commandPaletteOverlay && commandPaletteInput && commandPaletteResults) {
      const openPalette = () => {
        commandPaletteOverlay.style.display = 'flex';
        commandPaletteInput.value = '';
        buildPaletteResults('');
        commandPaletteInput.focus();
      };

      const closePalette = () => {
        commandPaletteOverlay.style.display = 'none';
        commandPaletteInput.value = '';
      };

      const buildPaletteResults = (query) => {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        const uniqueLinks = allLinks.reduce((acc, link) => {
          const text = link.innerText.trim();
          const href = link.href;
          if (text && href && !href.includes('javascript:void(0)') && !acc.some(l => l.href === href || l.text === text)) {
             if (!link.closest('.pagination')) { 
               acc.push({ href: href, text: text });
             }
          }
          return acc;
        }, []);
        
        const filtered = uniqueLinks.filter(link => link.text.toLowerCase().includes(query.toLowerCase()));
        
        commandPaletteResults.innerHTML = '';
        filtered.slice(0, 10).forEach(link => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = link.href;
          a.textContent = link.text;
          a.onclick = closePalette; 
          li.appendChild(a);
          commandPaletteResults.appendChild(li);
        });
      };

      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          openPalette();
        }
        if (e.key === 'Escape' && commandPaletteOverlay.style.display === 'flex') {
          closePalette();
        }
      });

      commandPaletteInput.addEventListener('input', () => buildPaletteResults(commandPaletteInput.value));
      commandPaletteOverlay.addEventListener('click', (e) => {
        if (e.target === commandPaletteOverlay) {
          closePalette();
        }
      });
  }

  // --- "On this page" Sticky TOC ---
  const tocContainer = document.getElementById('toc-container');
  const articleBodyForToc = document.querySelector('.article-body');

  if (tocContainer && articleBodyForToc) {
    const headings = articleBodyForToc.querySelectorAll('h2, h3');
    if (headings.length > 1) {
      const tocList = document.createElement('ul');
      tocList.className = 'toc-list';
      let tocTitle = document.createElement('h3');
      tocTitle.textContent = 'On this page';
      tocContainer.appendChild(tocTitle);
      
      headings.forEach((heading, i) => {
        const id = 'toc-heading-' + i;
        heading.id = id;
        
        const li = document.createElement('li');
        li.className = 'toc-level-' + heading.tagName.toLowerCase().charAt(1);
        
        const a = document.createElement('a');
        a.textContent = heading.textContent;
        a.href = '#' + id;
        
        li.appendChild(a);
        tocList.appendChild(li);
      });
      
      tocContainer.appendChild(tocList);

      const tocLinks = tocContainer.querySelectorAll('a');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const id = entry.target.getAttribute('id');
          const correspondingLink = tocContainer.querySelector(`a[href="#${id}"]`);
          if (correspondingLink) {
            if (entry.isIntersecting) {
              tocLinks.forEach(link => link.classList.remove('is-active'));
              correspondingLink.classList.add('is-active');
            }
          }
        });
      }, { rootMargin: "0px 0px -80% 0px" });

      headings.forEach(heading => observer.observe(heading));
    }
  }

  // --- Image Comparison Slider ---
  document.querySelectorAll('.comparison-slider').forEach(slider => {
    let isDragging = false;
    const handle = slider.querySelector('.slider-handle');
    const topImg = slider.querySelector('.img-top');

    const moveSlider = (e) => {
      if (!isDragging) return;
      e.preventDefault(); 
      const rect = slider.getBoundingClientRect();
      let x = (e.clientX || e.touches[0].clientX) - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const percentage = (x / rect.width) * 100;
      topImg.style.width = percentage + '%';
      handle.style.left = percentage + '%';
    };

    handle.addEventListener('mousedown', (e) => { e.preventDefault(); isDragging = true; });
    handle.addEventListener('touchstart', (e) => { e.preventDefault(); isDragging = true; });
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);
    document.addEventListener('mousemove', moveSlider);
    document.addEventListener('touchmove', moveSlider);
  });

  // --- Click-to-Zoom Images ---
  const articleBodyForZoom = document.querySelector('.article-body');
  if (articleBodyForZoom) {
    articleBodyForZoom.querySelectorAll('img').forEach(img => {
      if (!img.closest('a')) { 
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
          const overlay = document.createElement('div');
          overlay.className = 'image-zoom-overlay';
          const zoomedImg = document.createElement('img');
          zoomedImg.src = img.src;
          overlay.appendChild(zoomedImg);
          document.body.appendChild(overlay);

          setTimeout(() => overlay.classList.add('visible'), 10);
          
          overlay.addEventListener('click', () => {
            overlay.classList.remove('visible');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
          });
        });
      }
    });
  }

  // --- Article Reading Progress Bar ---
  const progressBar = document.getElementById('reading-progress-bar');
  if (!progressBar) {
      const newProgressBar = document.createElement('div');
      newProgressBar.id = 'reading-progress-bar';
      document.body.appendChild(newProgressBar);
  }
  
  const updateProgressBar = () => {
    const bar = document.getElementById('reading-progress-bar');
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight > 0) {
      const progress = (scrollTop / scrollHeight) * 100;
      bar.style.width = progress + '%';
    } else {
        bar.style.width = '0%';
    }
  };
  window.addEventListener('scroll', updateProgressBar);
  
  // --- Interactive Checklists ---
  document.querySelectorAll('.interactive-checklist li').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
    });
  });

  // --- Zendesk Garden: Stepper ---
  document.querySelectorAll('.stepper').forEach(stepper => {
    const steps = stepper.querySelectorAll('.stepper-item');
    steps.forEach((step, index) => {
      step.addEventListener('click', () => {
        steps.forEach((s, i) => {
          s.classList.remove('is-active', 'is-completed');
          if (i < index) {
            s.classList.add('is-completed');
          } else if (i === index) {
            s.classList.add('is-active');
          }
        });
      });
    });
  });

  // --- Custom Article Layouts, Animated Details, Copy-to-Clipboard ---
  const kbArticle = document.getElementById('kb-article-wrapper');
  if (kbArticle) {
      document.body.classList.add('kb-article-view');
  }

  const allDetails = document.querySelectorAll('.kb-details');
  allDetails.forEach((details) => {
      const summary = details.querySelector('.kb-summary');
      const content = details.querySelector('.kb-details-content');

      if (summary && content) {
          summary.addEventListener('click', (event) => {
              event.preventDefault(); 
              if (details.open) {
                  const closingAnimation = content.animate({
                      height: [content.offsetHeight + 'px', 0]
                  }, { duration: 200, easing: 'ease-out' });
                  closingAnimation.onfinish = () => {
                      details.removeAttribute('open');
                  };
              } else {
                  details.setAttribute('open', '');
                  content.animate({
                      height: [0, content.offsetHeight + 'px']
                  }, { duration: 200, easing: 'ease-out' });
              }
          });
      }
  });

  const allCopySnippets = document.querySelectorAll('.kb-copy-snippet');
  allCopySnippets.forEach(snippet => {
      const button = snippet.querySelector('button');
      const textToCopyEl = snippet.querySelector('code');

      if (button && textToCopyEl) {
          button.addEventListener('click', () => {
              navigator.clipboard.writeText(textToCopyEl.innerText).then(() => {
                  const originalText = button.innerHTML;
                  button.innerHTML = 'Copied!';
                  button.classList.add('copied');
                  setTimeout(() => {
                      button.innerHTML = originalText;
                      button.classList.remove('copied');
                  }, 2000);
              }).catch(err => {
                  console.error('Failed to copy text: ', err);
              });
          });
      }
  });

  // Expand/Collapse All Details
  const expandBtn = document.getElementById('expandAllDetails');
  const collapseBtn = document.getElementById('collapseAllDetails');
  if (expandBtn && collapseBtn && allDetails.length > 0) {
    expandBtn.addEventListener('click', () => {
      allDetails.forEach(details => {
        if (!details.open) details.querySelector('.kb-summary').click();
      });
    });

    collapseBtn.addEventListener('click', () => {
      allDetails.forEach(details => {
        if (details.open) details.querySelector('.kb-summary').click();
      });
    });
  }

  // --- Hotspots functionality ---
  const allHotspots = document.querySelectorAll('.hotspot');
  allHotspots.forEach(hotspot => {
    hotspot.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const isActive = hotspot.classList.contains('active');
      allHotspots.forEach(h => h.classList.remove('active'));
      if (!isActive) {
        hotspot.classList.add('active');
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hotspot')) {
      allHotspots.forEach(h => h.classList.remove('active'));
    }
  });

  // --- Content Drawer functionality ---
  const drawerOverlay = document.getElementById('contentDrawerOverlay');
  const drawerPanel = document.getElementById('contentDrawerPanel');
  const drawerTitle = document.getElementById('contentDrawerTitle');
  const drawerContent = document.getElementById('contentDrawerContent');
  const drawerCloseBtn = document.getElementById('contentDrawerClose');

  if (drawerOverlay && drawerPanel && drawerCloseBtn) {
      const openDrawer = () => {
        drawerOverlay.classList.add('is-open');
      };
      const closeDrawer = () => {
        drawerOverlay.classList.remove('is-open');
        setTimeout(() => {
          if(drawerTitle) drawerTitle.textContent = 'Loading...';
          if(drawerContent) drawerContent.innerHTML = '';
          if(drawerContent) drawerContent.classList.remove('is-loading');
        }, 300);
      };

      const loadDrawerContent = async (url, selector) => {
        openDrawer();
        if(drawerContent) drawerContent.classList.add('is-loading');

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const htmlText = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');
          
          const targetElement = doc.querySelector(selector);
          const articleTitle = doc.querySelector('h1.article-title');

          if (targetElement) {
            if(drawerTitle) drawerTitle.textContent = articleTitle ? articleTitle.innerText.trim() : 'Content';
            if(drawerContent) drawerContent.innerHTML = targetElement.innerHTML;
          } else {
            if(drawerTitle) drawerTitle.textContent = 'Error';
            if(drawerContent) drawerContent.innerHTML = `<p>Sorry, the requested content with the selector "<strong>${selector}</strong>" could not be found in the linked article.</p>`;
          }
        } catch (error) {
          console.error('Error fetching drawer content:', error);
          if(drawerTitle) drawerTitle.textContent = 'Error';
          if(drawerContent) drawerContent.innerHTML = '<p>Sorry, there was an error loading the content.</p>';
        } finally {
          if(drawerContent) drawerContent.classList.remove('is-loading');
        }
      };

      document.body.addEventListener('click', (e) => {
        const drawerLink = e.target.closest('a[data-drawer-content]');
        if (drawerLink) {
          e.preventDefault();
          const url = drawerLink.href;
          const selector = drawerLink.dataset.drawerContent;
          loadDrawerContent(url, selector);
        }
      });

      drawerCloseBtn.addEventListener('click', closeDrawer);
      drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) {
          closeDrawer();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawerOverlay.classList.contains('is-open')) {
          closeDrawer();
        }
      });
  }

  // --- Interactive Comparison Grid ---
  document.querySelectorAll('.comparison-grid-container').forEach(container => {
    const filterButtons = container.querySelectorAll('.grid-filter-btn');
    const grid = container.querySelector('.comparison-grid');
    const cells = container.querySelectorAll('.grid-cell');
    
    if (!grid || filterButtons.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const colToHighlight = button.dataset.highlightCol;

        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (colToHighlight === 'all') {
          grid.classList.remove('is-highlighting');
          cells.forEach(cell => {
            cell.classList.remove('is-faded', 'is-highlighted');
          });
        } else {
          grid.classList.add('is-highlighting');
          cells.forEach(cell => {
            cell.classList.remove('is-faded', 'is-highlighted');
            if (cell.classList.contains('col-' + colToHighlight)) {
              cell.classList.add('is-highlighted');
            } else if (!cell.classList.contains('grid-label')) {
              cell.classList.add('is-faded');
            }
          });
        }
      });
    });
  });

  // --- Animated Chart Feature ---
  const savingsChartCtx = document.getElementById('savingsGrowthChart');
  if (savingsChartCtx && typeof Chart !== 'undefined') {
    const labels = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const data = {
      labels: labels,
      datasets: [{
        label: 'Total Savings',
        backgroundColor: 'rgba(62, 79, 229, 0.8)',
        borderColor: 'rgb(62, 79, 229)',
        borderWidth: 1,
        borderRadius: 4,
        data: [2255, 3568, 4941, 6380, 7888],
      }]
    };
    const config = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Savings Balance ($)' }
        },
        scales: { y: { beginAtZero: true } }
      }
    };
    new Chart(savingsChartCtx, config);
  }

  // --- Scenario Toggles ---
  document.querySelectorAll('.scenario-toggles').forEach(container => {
    const buttons = container.querySelectorAll('.scenario-btn');
    const contentWrapper = container.nextElementSibling;
    
    if (!contentWrapper || !contentWrapper.classList.contains('scenario-content-wrapper')) return;

    const scenarioContents = contentWrapper.querySelectorAll('.scenario-content');

    if (buttons.length > 0 && scenarioContents.length > 0) {
      buttons[0].classList.add('active');
      const defaultScenario = buttons[0].dataset.scenarioTarget;
      const defaultContent = contentWrapper.querySelector(`.scenario-content[data-scenario="${defaultScenario}"]`);
      if (defaultContent) defaultContent.classList.add('is-active');
    }
    
    container.addEventListener('click', (e) => {
      if (!e.target.matches('.scenario-btn')) return;
      const button = e.target;
      const targetScenario = button.dataset.scenarioTarget;

      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      scenarioContents.forEach(content => {
        content.classList.remove('is-active');
        if (content.dataset.scenario === targetScenario) {
          content.classList.add('is-active');
        }
      });
    });
  });

  // --- Favorites Toolkit ---
  const FAVORITES_KEY = 'percapitaKbFavorites';
  const favoritesListContainer = document.getElementById('favorites-list');
  const favoriteBtn = document.querySelector('.favorite-btn');

  const getFavorites = () => JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  const saveFavorites = (favs) => localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));

  const renderFavoritesList = () => {
    if (!favoritesListContainer) return;
    const favorites = getFavorites();
    favoritesListContainer.innerHTML = '';
    if (favorites.length === 0) {
      favoritesListContainer.innerHTML = '<li class="no-favorites">You haven\'t favorited any articles yet.</li>';
    } else {
      favorites.forEach(fav => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = fav.url;
        a.textContent = fav.title;
        a.setAttribute('role', 'menuitem');
        li.appendChild(a);
        favoritesListContainer.appendChild(li);
      });
    }
  };

  const setupFavoriteButton = () => {
    if (!favoriteBtn) return;
    const currentUrl = window.location.href;
    const favorites = getFavorites();
    const isFavorited = favorites.some(fav => fav.url === currentUrl);

    if (isFavorited) {
      favoriteBtn.classList.add('is-favorite');
      favoriteBtn.querySelector('span').textContent = 'Favorited';
    }

    favoriteBtn.addEventListener('click', () => {
      let currentFavorites = getFavorites();
      const articleTitle = document.querySelector('h1.article-title')?.innerText.trim();
      if (!articleTitle) return;

      const articleUrl = window.location.href;
      const favoriteIndex = currentFavorites.findIndex(fav => fav.url === articleUrl);

      if (favoriteIndex > -1) {
        currentFavorites.splice(favoriteIndex, 1);
        favoriteBtn.classList.remove('is-favorite');
        favoriteBtn.querySelector('span').textContent = 'Favorite';
      } else {
        currentFavorites.push({ title: articleTitle, url: articleUrl });
        favoriteBtn.classList.add('is-favorite');
        favoriteBtn.querySelector('span').textContent = 'Favorited';
      }
      
      saveFavorites(currentFavorites);
      renderFavoritesList();
    });
  };
  
  renderFavoritesList();
  setupFavoriteButton();

  // --- Sticky In-Page Navigation ---
  const stickyNav = document.querySelector('.kb-sticky-nav');
  if (stickyNav) {
    const navOffsetTop = stickyNav.offsetTop;
    const handleScroll = () => {
      if (window.scrollY >= navOffsetTop) {
        stickyNav.classList.add('stuck');
      } else {
        stickyNav.classList.remove('stuck');
      }
    };
    window.addEventListener('scroll', handleScroll);

    stickyNav.querySelectorAll('a').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offsetPosition = targetElement.offsetTop - (stickyNav.offsetHeight + 20);
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      });
    });
  }

  // --- Custom Tabbed Content (ARIA compliant) ---
  document.querySelectorAll('.tab-container').forEach(container => {
    const tabList = container.querySelector('.tab-list');
    const tabs = container.querySelectorAll('.tab');
    
    if (!tabList) return;

    const activateTab = (tab) => {
      const panelId = tab.getAttribute('aria-controls');
      const targetPanel = document.getElementById(panelId);

      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      tabs.forEach(t => {
        const p_id = t.getAttribute('aria-controls');
        if(p_id) {
            const p = document.getElementById(p_id);
            if (p) p.setAttribute('hidden', 'hidden');
        }
      });

      tab.setAttribute('aria-selected', 'true');
      if (targetPanel) {
        targetPanel.removeAttribute('hidden');
      }
    };
    
    if (tabs.length > 0 && !container.querySelector('[aria-selected="true"]')) {
      activateTab(tabs[0]);
    }

    tabList.addEventListener('click', (e) => {
      if (e.target.matches('.tab')) {
        activateTab(e.target);
      }
    });

    tabList.addEventListener('keydown', (e) => {
      if (e.target.matches('.tab')) {
        let index = Array.from(tabs).indexOf(e.target);
        if (e.key === 'ArrowRight') {
          index = (index + 1) % tabs.length;
          tabs[index].focus();
          activateTab(tabs[index]);
        } else if (e.key === 'ArrowLeft') {
          index = (index - 1 + tabs.length) % tabs.length;
          tabs[index].focus();
          activateTab(tabs[index]);
        }
      }
    });
  });

  // --- Accordion Component ---
  document.querySelectorAll('.accordion').forEach(acc => {
    acc.addEventListener('click', function() {
        this.classList.toggle('active');
        const panel = this.nextElementSibling;
        if(panel) {
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        }
    });
  });

  // --- Custom Video Player ---
  document.querySelectorAll('.kb-video-container').forEach(container => {
    const playButton = container.querySelector('.kb-video-play-btn');
    const videoUrl = container.dataset.videoSrc;
    const playerWrapper = container.querySelector('.kb-video-player');

    if (playButton && videoUrl && playerWrapper) {
        playButton.addEventListener('click', (event) => {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', videoUrl);
            iframe.setAttribute('width', '560');
            iframe.setAttribute('height', '315');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');

            playerWrapper.innerHTML = ''; 
            playerWrapper.appendChild(iframe);
            event.target.style.display = 'none'; 
        });
    }
  });

});